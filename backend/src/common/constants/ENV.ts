// /StackFusionZiyiliuTop/backend/src/common/constants/ENV.ts
/* eslint-disable n/no-process-env */
import path from "path";
import dotenv from "dotenv";
import {cleanEnv, email, num, port, str} from "envalid";

export enum NodeEnvs {
    Dev = "development",
    Test = "test",
    Production = "production"
}

// Choose the right file based on NODE_ENV (defaults to “development”)
const mode = process.env.NODE_ENV ?? NodeEnvs.Dev;
const envFileName = `.env.${mode}`;

// Load it from your project root
dotenv.config({
    path: path.resolve(process.cwd(), envFileName),
});

const env = cleanEnv(process.env, {
    // general
    NODE_ENV: str({default: NodeEnvs.Dev}),
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
    NOTION_ROOT_BLOG_LIST: str({default: ""}),
    NOTION_CACHE_EXPIRY_SECONDS: num({default: 3600}),
});

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
} = env;
