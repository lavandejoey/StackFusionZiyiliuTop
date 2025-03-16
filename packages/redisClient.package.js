// redisClient.js
const Redis = require("ioredis");

// Initialize Redis client
const redis = new Redis({
    port: process.env.REDIS_LOCAL_PORT,
    host: process.env.REDIS_LOCAL_HOST,
    username: process.env.REDIS_USER,
    password: process.env.REDIS_PASSWORD
}).on("connect", () => {
    console.log("Connected to Redis");
});

module.exports = redis;
