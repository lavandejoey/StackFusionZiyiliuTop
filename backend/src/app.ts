// /StackFusionZiyiliuTop/backend/src/app.ts
/* Packages */
import express from "express";
import helmet from "helmet";
import session from "express-session";
import cors from "cors";
import cookieParser from "cookie-parser";
import process from "node:process";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";

dotenv.config();

/* Utils */
import {redisClient} from "utils/redisClient.util";
import {RedisStore} from "connect-redis";

/* Routers */
import jwtRouter from "api/v1/jwtRouter";
import userRouter from "api/v1/userRouter";
import proxyRouter from "api/v1/v2rayRouter";
import contactRouter from "api/v1/contactRouter";
import blogRouter from "api/v1/blogRouter";
import {errorResponse} from "middlewares/response";

const PORT = Number(process.env.BACKEND_PORT) || 2069;
const IS_PROD = process.env.NODE_ENV === "production";

// Remove any trailing slash from your configured frontend URL:
const rawDomain = IS_PROD
    ? process.env.FRONTEND_DOMAIN_PROD
    : process.env.FRONTEND_DOMAIN_DEV;
const DOMAIN = rawDomain?.replace(/\/+$/, "");

const app = express();
if (IS_PROD) app.set("trust proxy", 1); // trust first proxy
// Enable CORS for exactly your frontend origin, with credentials:
app.use(cors({
    origin: DOMAIN,
    credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cookieParser());
app.use(helmet());

app.use(session({
    store: new RedisStore({client: redisClient}),
    secret: process.env.REDIS_SECRET_KEY!,
    resave: false,
    saveUninitialized: false,
    cookie: {
        // httpOnly: true,
        secure: IS_PROD,
        maxAge: 24 * 60 * 60 * 1000, // 1 day
        sameSite: "lax",
    },
}));

// Routers
app.use(`/api/${process.env.API_VERSION}/jwt`, jwtRouter);
app.use(`/api/${process.env.API_VERSION}/user`, userRouter);
app.use(`/api/${process.env.API_VERSION}/proxy`, proxyRouter);
app.use(`/api/${process.env.API_VERSION}/contact`, contactRouter);
app.use(`/api/${process.env.API_VERSION}/blog`, blogRouter);

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

// 404 handler
app.use((req, res) => {
    res.status(404).json(errorResponse(req, 404, "Not found"));
    return;
});