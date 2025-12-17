// src/services/GithubService.ts
import { Octokit } from "@octokit/core";
import { redisClient } from "@src/common/util/redisClient";
import { RepoProps } from "@src/types/repo";
import logger from "jet-logger";
import {
    GITHUB_ACCESS_TOKEN,
    GITHUB_REPO_LIST,
    REPO_CACHE_OVERWRITE,
} from "@src/common/constants/ENV";
import { inspect } from "util";
import fetch from "node-fetch";

const safeStringify = (v: unknown) => {
    if (typeof v === "object" && v !== null) {
        try {
            return JSON.stringify(v);
        } catch {
            return inspect(v, { depth: 2 });
        }
    }
    return String(v);
};

const octokit = new Octokit({
    auth: GITHUB_ACCESS_TOKEN,
});

const CACHE_KEY = "github-repos";
const CACHE_EXPIRATION = 24 * 60 * 60; // 24 hours in seconds

type LocalRepoEntry = Omit<RepoProps, "url" | "visibility"> & { type?: string };
const initialRepos: LocalRepoEntry[] = GITHUB_REPO_LIST as unknown as LocalRepoEntry[];

// Diagnostic log: show what repos were parsed at startup
try {
    logger.info(`GITHUB_REPO_LIST parsed: ${safeStringify(initialRepos)}`);
} catch (err) {
    logger.err(`Error logging initial repo list: ${String(err)}`);
}

async function fetchRepoDetails(
    platform: string, owner: string, repo: string, hfType?: string,
): Promise<Partial<RepoProps>> {
    try {
        if (platform === "github") {
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
                    const ownerObj =
                        typeof obj.owner === "object" && obj.owner !== null
                            ? (obj.owner as Record<string, unknown>)
                            : {};

                    return {
                        platform: "github",
                        url:
                            typeof obj.html_url === "string"
                                ? obj.html_url
                                : `https://github.com/${owner}/${repo}`,
                        owner:
                            typeof ownerObj.login === "string" ? ownerObj.login : owner,
                        name: typeof obj.name === "string" ? obj.name : repo,
                        description:
                            typeof obj.description === "string" ? obj.description : "",
                        topics: Array.isArray(obj.topics) ? (obj.topics as string[]) : [],
                        language:
                            typeof obj.language === "string" ? obj.language : undefined,
                        license:
                            typeof obj.license === "object" && obj.license !== null
                                && typeof (obj.license as Record<string, unknown>).name === "string"
                                ? (obj.license as Record<string, unknown>).name as string
                                : undefined,
                        stars:
                            typeof obj.stargazers_count === "number" ? obj.stargazers_count : 0,
                        forks:
                            typeof obj.forks_count === "number" ? obj.forks_count : 0,
                        issues:
                            typeof obj.open_issues_count === "number" ? obj.open_issues_count : 0,
                        lastUpdated:
                            typeof obj.updated_at === "string" ? obj.updated_at : undefined,
                        visibility:
                            typeof obj.visibility === "string" ? obj.visibility : undefined,
                    };
                }

                logger.err(`Failed to fetch repo ${owner}/${repo}: non-object response`);
                return {} as Partial<RepoProps>;
            } else {
                logger.err(`Failed to fetch repo ${owner}/${repo}: ${String(response.status)}`);
                return {} as Partial<RepoProps>;
            }
        }

        // Hugging Face support: try model endpoint first
        if (platform === "huggingface") {
            const type = hfType ?? "models";
            try {
                const id = `${owner}/${repo}`;
                const hfApi = `https://huggingface.co/api/${type}/${id}`;
                const resp = await fetch(hfApi, { method: "GET" });
                if (resp.ok) {
                    const raw = await resp.json();

                    let description = "";
                    let topics: string[] = [];
                    let license: string | undefined;
                    let likes: number | undefined;

                    if (typeof raw === "object" && raw !== null) {
                        const data = raw as Record<string, unknown>;
                        const card =
                            data.cardData && typeof data.cardData === "object"
                                ? (data.cardData as Record<string, unknown>)
                                : undefined;

                        if (card && typeof card.description === "string") description = card.description;
                        else if (typeof data.description === "string") description = data.description;

                        if (Array.isArray(data.tags)) topics = data.tags as string[];
                        else if (card && Array.isArray(card.tags)) topics = card.tags as string[];

                        if (card && typeof card.license === "string") license = card.license;
                        else if (typeof data.license === "string") license = data.license;

                        if (typeof data.likes === "number") {
                            likes = data.likes;
                        } else {
                            const maybe = (data)._likes;
                            if (typeof maybe === "number") likes = maybe;
                        }
                    }

                    const publicUrl =
                        type === "models"
                            ? `https://huggingface.co/${id}`
                            : `https://huggingface.co/${type}/${id}`;
                    logger.info(`Fetched HF ${type} metadata for ${id}`);
                    return {
                        platform: "huggingface",
                        url: publicUrl,
                        owner,
                        name: repo,
                        description: description,
                        topics,
                        license,
                        likes,
                    } as Partial<RepoProps>;
                } else {
                    logger.err(
                        `HuggingFace fetch failed for ${owner}/${repo} (type=${type}): ${resp.status}`,
                    );
                    const publicUrl =
                        type === "models"
                            ? `https://huggingface.co/${id}`
                            : `https://huggingface.co/${type}/${id}`;
                    return {
                        platform: "huggingface",
                        url: publicUrl,
                        owner,
                        name: repo,
                    } as Partial<RepoProps>;
                }
            } catch (e: unknown) {
                logger.err(`Error fetching HuggingFace ${owner}/${repo}: ${safeStringify(e)}`);
                const fallbackUrl =
                    hfType === "models" || !hfType
                        ? `https://huggingface.co/${owner}/${repo}`
                        : `https://huggingface.co/${hfType}/${owner}/${repo}`;
                return {
                    platform: "huggingface",
                    url: fallbackUrl,
                    owner,
                    name: repo,
                } as Partial<RepoProps>;
            }
        }

        // Unsupported platform fallback
        return {
            owner,
            name: repo,
        } as Partial<RepoProps>;
    } catch (err: unknown) {
        logger.err(`Error fetching repo ${owner}/${repo}: ${safeStringify(err)}`);
        return {} as Partial<RepoProps>;
    }
}

export async function getProcessedRepos(): Promise<RepoProps[]> {
    try {
        if (!REPO_CACHE_OVERWRITE && redisClient) {
            const exists = await redisClient.exists(CACHE_KEY);
            const cachedData = exists ? await redisClient.get(CACHE_KEY) : null;
            logger.info(`Cache check for ${CACHE_KEY}: exists=${exists}`);
            if (cachedData) {
                logger.info("Serving repos from cache");
                return JSON.parse(cachedData) as RepoProps[];
            }
        } else if (REPO_CACHE_OVERWRITE) {
            logger.info("REPO_CACHE_OVERWRITE enabled: skipping cache read and forcing refresh");
        }
    } catch (err) {
        logger.err(`Redis check failed: ${safeStringify(err)}`);
    }

    const fetchedRepos = await Promise.all(
        initialRepos.map(async (repo) => {
            const details = await fetchRepoDetails(repo.platform ?? "github", repo.owner, repo.name, (repo).type);
            const defaultUrl = repo.platform === "huggingface"
                ? `https://huggingface.co/${repo.owner}/${repo.name}`
                : `https://github.com/${repo.owner}/${repo.name}`;
            return {
                ...repo,
                ...details,
                url: details.url ?? defaultUrl,
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
