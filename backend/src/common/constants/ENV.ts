// /StackFusionZiyiliuTop/backend/src/common/constants/ENV.ts
/* eslint-disable n/no-process-env */
// src/common/constants/ENV.ts
import path from "path";
import dotenv from "dotenv";
import {cleanEnv, str, num, email} from "envalid";
import {port} from "envalid/dist/validators";
import {z} from "zod";
import logger from "jet-logger";

export enum NodeEnvs { Dev = "development", Test = "test", Production = "production" }

// -----------------------------------------------------------------------------
// 1. Load .env
// -----------------------------------------------------------------------------
dotenv.config({path: path.resolve(process.cwd(), ".env")});

// -----------------------------------------------------------------------------
// 2. Parse basic environment variables with envalid
// -----------------------------------------------------------------------------
export const env = cleanEnv(process.env, {
    // general
    NODE_ENV: str({choices: Object.values(NodeEnvs), default: "development"}),
    PORT: port({default: 3000}),
    API_VERSION: str({default: "v1"}),
    AUTHOR: str({default: "N/A"}),
    DOMAIN: str({default: "localhost"}),

    // frontend
    FRONTEND_DOMAIN_PROD: str(),
    FRONTEND_DOMAIN_DEV: str(),

    // rate-limiting
    CONTACT_RATE_LIMIT_WINDOW_MS: num({default: 60 * 60 * 1000}), // 1h

    // MySQL
    DB_HOST: str({default: "127.0.0.1"}),
    DB_PORT: port({default: 3306}),
    DB_USER: str(),
    DB_PASSWORD: str(),
    DB_NAME: str(),

    // Redis
    REDIS_LOCAL_HOST: str({default: "127.0.0.1"}),
    REDIS_LOCAL_PORT: port({default: 6379}),
    REDIS_USER: str({default: ""}),
    REDIS_PASSWORD: str({default: ""}),

    // auth / JWT
    SECRET_KEY: str(),
    ACCESS_TOKEN_EXPIRY_MS: num({default: 24 * 60 * 60 * 1000}),  // 24 h
    REFRESH_TOKEN_EXPIRY_MS: num({default: 24 * 60 * 60 * 1000}), // 24 h
    ACCESS_TOKEN_PREFIX: str({default: "access:"}),
    REFRESH_TOKEN_PREFIX: str({default: "refresh:"}),
    SERVER_ID: str({default: ""}),
    SERVER_SECRET: str({default: ""}),

    // email / Postmark
    POSTMARK_API_TOKEN: str(),
    NO_REPLY_EMAIL: email(),
    CONTACT_EMAIL: email(),

    // AI / Notion
    OPENAI_API_KEY: str({default: ""}),
    ANTHROPIC_API_KEY: str({default: ""}),
    DEFAULT_MODEL: str({default: ""}),
    NOTION_API_KEY: str({default: ""}),
    NOTION_CACHE_EXPIRY_SECONDS: num({default: 3600}),
    GITHUB_ACCESS_TOKEN: str({default: ""}),

    // Content
    NOTION_ROOT_BLOG_LIST: str({default: ""}),
    GITHUB_REPO_LIST: str({default: "[]" /* will be parsed by Zod below */}),
});

// -----------------------------------------------------------------------------
// 3. Define Zod schema for complex JSON envs
// -----------------------------------------------------------------------------
const RepoSchema = z.object({
    platform: z.literal("github"),
    owner: z.string().min(1),
    name: z.string().min(1),
    pinned: z.boolean().optional(),
});
const RepoArraySchema = z.array(RepoSchema);

// -----------------------------------------------------------------------------
// 4. Utility: safe JSON parsing for env vars
// -----------------------------------------------------------------------------
function parseJsonEnv<T>(
    value: string | undefined,
    name: string,
    schema: z.ZodType<T>
): T {
    if (!value) throw new Error(`Missing env var: ${name}`);
    let parsed: unknown;
    try {
        parsed = JSON.parse(value);
    } catch (err) {
        throw new Error(`Env var ${name} is not valid JSON: ${(err as Error).message}`);
    }
    const result = schema.safeParse(parsed);
    if (!result.success) {
        throw new Error(`Env var ${name} failed validation: ${result.error.message}`);
    }
    return result.data;
}

// -----------------------------------------------------------------------------
// 5. Parse GITHUB_REPO_LIST
// -----------------------------------------------------------------------------
export const GITHUB_REPO_LIST = (() => {
    try {
        const parsed = parseJsonEnv(env.GITHUB_REPO_LIST, "GITHUB_REPO_LIST", RepoArraySchema);
        return parsed;
    } catch (err) {
        logger.err("Failed to parse GITHUB_REPO_LIST: " + (err as Error).message);
        return [];
    }
})();

// -----------------------------------------------------------------------------
// 6. Export convenience vars
// -----------------------------------------------------------------------------
export const {
    NODE_ENV,
    PORT,
    API_VERSION,
    AUTHOR,
    DOMAIN,
    FRONTEND_DOMAIN_PROD,
    FRONTEND_DOMAIN_DEV,
    CONTACT_RATE_LIMIT_WINDOW_MS,
    DB_HOST,
    DB_PORT,
    DB_USER,
    DB_PASSWORD,
    DB_NAME,
    REDIS_LOCAL_HOST,
    REDIS_LOCAL_PORT,
    REDIS_USER,
    REDIS_PASSWORD,
    SECRET_KEY,
    ACCESS_TOKEN_EXPIRY_MS,
    REFRESH_TOKEN_EXPIRY_MS,
    ACCESS_TOKEN_PREFIX,
    REFRESH_TOKEN_PREFIX,
    SERVER_ID,
    SERVER_SECRET,
    POSTMARK_API_TOKEN,
    NO_REPLY_EMAIL,
    CONTACT_EMAIL,
    OPENAI_API_KEY,
    ANTHROPIC_API_KEY,
    DEFAULT_MODEL,
    NOTION_API_KEY,
    NOTION_ROOT_BLOG_LIST,
    NOTION_CACHE_EXPIRY_SECONDS,
    GITHUB_ACCESS_TOKEN,
} = env;
