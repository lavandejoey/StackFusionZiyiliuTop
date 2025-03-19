// /StackFusionZiyiliuTop/backend/src/app.ts
/* Packages */
import express from "express";
import helmet from "helmet";
import session from "express-session";
import cors from "cors";
import process from "node:process";
import dotenv from "dotenv";

dotenv.config()
/* Utils */
import {redisClient} from "utils/redisClient.util";
import {RedisStore} from "connect-redis";
/* Routers */
import jwtRouter from "api/v1/jwtRouter"
import userRouter from "api/v1/userRouter"
import proxyRouter from "api/v1/v2rayRouter";

const PORT = process.env.BACKEND_PORT;
const IS_PROD = process.env.NODE_ENV === "production";
const DOMAIN = IS_PROD ? process.env.FRONTEND_DOMAIN_PROD : process.env.FRONTEND_DOMAIN_DEV;
const app = express();

app.use(express.json())
app.use(express.urlencoded({extended: true}));
app.use(cors({
    origin: DOMAIN,
    credentials: true,
}));
app.use(helmet());
app.use(session({
    store: new RedisStore({client: redisClient}),
    secret: process.env.SECRET_KEY as string,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: IS_PROD,
        maxAge: 24 * 60 * 60 * 1000, // 1 day
        sameSite: 'lax'
    }
}));

// Routers
app.use(`/api/${process.env.API_VERSION}/jwt`, jwtRouter);
app.use(`/api/${process.env.API_VERSION}/user`, userRouter);
app.use(`/api/${process.env.API_VERSION}/v2ray`, proxyRouter);

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
})