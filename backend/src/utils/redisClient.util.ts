// /StackFusionZiyiliuTop/backend/src/utils/redisClient.util.ts
import Redis from "ioredis";

// Initialize Redis client
export const redisClient = new Redis({
    port: process.env.REDIS_LOCAL_PORT ? parseInt(process.env.REDIS_LOCAL_PORT) : 6379,
    host: process.env.REDIS_LOCAL_HOST as string,
    username: process.env.REDIS_USER as string,
    password: process.env.REDIS_PASSWORD as string,
}).on("connect", () => {
    console.log("Connected to Redis");
});

export const redisSet = (key: string, value: string, expireSeconds: number) =>
    redisClient.set(key, value, "EX", expireSeconds);

export const redisGet = (key: string) => redisClient.get(key);

export const redisDel = async (key: string) => await redisClient.del(key);