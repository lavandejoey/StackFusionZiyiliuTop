// /StackFusionZiyiliuTop/backend/src/utils/redisClient.util.ts
import Redis from "ioredis";

// Initialize Redis client
const redisClient = new Redis({
    port: process.env.REDIS_LOCAL_PORT ? parseInt(process.env.REDIS_LOCAL_PORT) : 6379,
    host: process.env.REDIS_LOCAL_HOST as string,
    username: process.env.REDIS_USER as string,
    password: process.env.REDIS_PASSWORD as string,
}).on("connect", () => {
    console.log("Connected to Redis");
});

const redisSet = async (key: string, value: string, expireSeconds: number) => {
    // Check existence of key
    if (await redisClient.exists(key) === 1) {
        // Delete key if exists
        await redisClient.del(key);
    }
    // Set key with expiration - default 1 hour
    await redisClient.set(key, value, "EX", expireSeconds ? expireSeconds : 3600);
};

const redisGet = async (key: string): Promise<string | null> => {
    return redisClient.get(key);
};

const redisDel = async (key: string) => {
    await redisClient.del(key);
};
export {redisClient, redisSet, redisGet, redisDel};
