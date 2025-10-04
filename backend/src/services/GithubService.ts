// src/services/GithubService.ts
import {Octokit} from "@octokit/core";
import {redisClient} from "@src/common/util/redisClient";
import {RepoProps} from "@src/types/repo";
import logger from "jet-logger";
import {GITHUB_ACCESS_TOKEN, GITHUB_REPO_LIST} from "@src/common/constants/ENV";

const octokit = new Octokit({
    auth: GITHUB_ACCESS_TOKEN,
});

const CACHE_KEY = "github-repos";
const CACHE_EXPIRATION = 24 * 60 * 60; // 24 hours in seconds

const initialRepos: Omit<RepoProps, 'url' | 'visibility'>[] = GITHUB_REPO_LIST;

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
            const data = response.data;
            return {
                platform: "github",
                url: data.html_url,
                owner: data.owner.login,
                name: data.name,
                description: data.description ?? "",
                topics: data.topics ?? [],
                language: data.language ?? undefined,
                license: data.license?.name ?? undefined,
                stars: data.stargazers_count,
                forks: data.forks_count,
                issues: data.open_issues_count,
                lastUpdated: data.updated_at,
                visibility: data.visibility,
            };
        } else {
            logger.err(`Failed to fetch repo ${owner}/${repo}: ${response.status}`);
            return {};
        }
    } catch (error) {
        logger.err(`Error fetching repo ${owner}/${repo}: ${error}`);
        return {};
    }
}

export async function getProcessedRepos(): Promise<RepoProps[]> {
    if (redisClient && await redisClient.exists(CACHE_KEY)) {
        const cachedData = await redisClient.get(CACHE_KEY);
        if (cachedData) {
            logger.info("Serving from cache");
            return JSON.parse(cachedData);
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
        })
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
