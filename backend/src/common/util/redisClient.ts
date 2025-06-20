// /StackFusionZiyiliuTop/backend/src/common/util/redisClient.ts
import Redis from "ioredis";
import logger from "jet-logger";
import {
    REDIS_LOCAL_HOST,
    REDIS_LOCAL_PORT,
    REDIS_USER,
    REDIS_PASSWORD,
    SECRET_KEY as REDIS_SECRET_KEY,
} from "@src/common/constants/ENV";

// Initialize Redis client
export const redisClient = new Redis({
    host: REDIS_LOCAL_HOST,
    port: Number(REDIS_LOCAL_PORT),
    username: REDIS_USER,
    password: REDIS_PASSWORD,
    keyPrefix: REDIS_SECRET_KEY,
    retryStrategy(times) {
        return Math.min(times * 50, 2_000);
    },
});

redisClient
    .on("connect", () => logger.warn("Redis connected"))
    .on("reconnecting", () => logger.warn("Redis reconnecting…"))
    .on("error", (err: Error) => logger.err(`Redis error: ${err.message}`, true));

export const redisSet = (key: string, value: string, expireSeconds: number): Promise<"OK"> =>
    redisClient.set(key, value, "EX", expireSeconds);

export const redisGet = (key: string): Promise<string | null> => redisClient.get(key);

export const redisDel = async (key: string): Promise<number> => await redisClient.del(key);

