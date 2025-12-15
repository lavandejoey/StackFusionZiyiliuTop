// src/services/GithubService.ts
import { Octokit } from "@octokit/core";
import { redisClient } from "@src/common/util/redisClient";
import { RepoProps } from "@src/types/repo";
import logger from "jet-logger";
import { GITHUB_ACCESS_TOKEN, GITHUB_REPO_LIST } from "@src/common/constants/ENV";
import { inspect } from "util";

const safeStringify = (v: unknown) => {
    if (typeof v === "object" && v !== null) {
        try { return JSON.stringify(v); } catch { return inspect(v, { depth: 2 }); }
    }
    return String(v);
};

const octokit = new Octokit({
    auth: GITHUB_ACCESS_TOKEN,
});

const CACHE_KEY = "github-repos";
const CACHE_EXPIRATION = 24 * 60 * 60; // 24 hours in seconds

const initialRepos: Omit<RepoProps, "url" | "visibility">[] = GITHUB_REPO_LIST;

async function fetchRepoDetails(owner: string, repo: string): Promise<Partial<RepoProps>> {
    try {
        const response = await octokit.request("GET /repos/{owner}/{repo}", {
            owner,
            repo,
            headers: {
                "X-GitHub-Api-Version": "2022-11-28",
            },
        });

        if (response.status === 200) {
            const d = response.data as unknown;
            if (typeof d === "object" && d !== null) {
                const obj = d as Record<string, unknown>;
                const ownerObj = (
                    typeof obj.owner === "object" && obj.owner !== null ? obj.owner as Record<string, unknown> : {}
                );

                return {
                    platform: "github",
                    url: typeof obj.html_url === "string" ? obj.html_url : `https://github.com/${owner}/${repo}`,
                    owner: typeof ownerObj.login === "string" ? ownerObj.login : owner,
                    name: typeof obj.name === "string" ? obj.name : repo,
                    description: typeof obj.description === "string" ? obj.description : "",
                    topics: Array.isArray(obj.topics) ? obj.topics as string[] : [],
                    language: typeof obj.language === "string" ? obj.language : undefined,
                    license: typeof obj.license === "object" && obj.license !== null && typeof (obj.license as Record<string, unknown>).name === "string" ? (obj.license as Record<string, unknown>).name as string : undefined,
                    stars: typeof obj.stargazers_count === "number" ? obj.stargazers_count : 0,
                    forks: typeof obj.forks_count === "number" ? obj.forks_count : 0,
                    issues: typeof obj.open_issues_count === "number" ? obj.open_issues_count : 0,
                    lastUpdated: typeof obj.updated_at === "string" ? obj.updated_at : undefined,
                    visibility: typeof obj.visibility === "string" ? obj.visibility : undefined,
                };
            }

            logger.err(`Failed to fetch repo ${owner}/${repo}: non-object response`);
            return {} as Partial<RepoProps>;
        } else {
            logger.err(`Failed to fetch repo ${owner}/${repo}: ${String(response.status)}`);
            return {} as Partial<RepoProps>;
        }
    } catch (err: unknown) {
        logger.err(`Error fetching repo ${owner}/${repo}: ${safeStringify(err)}`);
        return {} as Partial<RepoProps>;
    }
}

export async function getProcessedRepos(): Promise<RepoProps[]> {
    if (redisClient && await redisClient.exists(CACHE_KEY)) {
        const cachedData = await redisClient.get(CACHE_KEY);
        if (cachedData) {
            logger.info("Serving from cache");
            return JSON.parse(cachedData) as RepoProps[];
        }
    }

    const fetchedRepos = await Promise.all(
        initialRepos.map(async (repo) => {
            const details = await fetchRepoDetails(repo.owner, repo.name);
            return {
                ...repo,
                ...details,
                url: `https://github.com/${repo.owner}/${repo.name}`,
            } as RepoProps;
        }),
    );

    const sortedRepos = fetchedRepos.sort((a, b) => {
        const aDate = a.lastUpdated ? new Date(a.lastUpdated).getTime() : 0;
        const bDate = b.lastUpdated ? new Date(b.lastUpdated).getTime() : 0;

        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;

        return bDate - aDate;
    });

    if (redisClient) {
        await redisClient.set(CACHE_KEY, JSON.stringify(sortedRepos), "EX", CACHE_EXPIRATION);
        // logger.info("Saved to cache");
    }

    return sortedRepos;
}
