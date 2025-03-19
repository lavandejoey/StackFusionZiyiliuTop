// /StackFusionZiyiliuTop/backend/src/api/v1/jwtRouter.ts
import {Router} from "express"
import jwt, {JwtPayload} from "jsonwebtoken"
import {successResponse, errorResponse} from "middlewares/response";
import {UserModel} from "models/user.model";
import * as process from "node:process";
import {redisGet, redisSet} from "utils/redisClient.util";

const jwtRouter = Router()
const JWT_SECRET: string = process.env.JWT_SECRET_KEY || "secret";
const REFRESH_TOKEN_EXPIRY: number = Number(process.env.REFRESH_TOKEN_EXPIRY) || 3600;
const ACCESS_TOKEN_EXPIRY: number = Number(process.env.ACCESS_TOKEN_EXPIRY) || 3600;

// JWT Secret Key Generation
const jwtGenerate = (uuid: string, email: string, validPeriod: number) => {
    const currentTime: number = Math.floor(Date.now() / 1000);
    const payload: object = {
        iss: process.env.BACKEND_DOMAIN_PROD,
        sub: uuid,
        exp: currentTime + validPeriod,
        iat: currentTime,
        email: email
    };
    return jwt.sign(payload, JWT_SECRET);
}
const accessToken = (uid: string, email: string) => {
    return jwtGenerate(uid, email, ACCESS_TOKEN_EXPIRY);
}
const refreshToken = async (uid: string, email: string) => {
    const token: string = jwtGenerate(uid, email, REFRESH_TOKEN_EXPIRY);
    await redisSet(`refreshToken:${uid}`, token, REFRESH_TOKEN_EXPIRY);
    return token;
}

/** Email Login for JWT
 * POST /api/v1/login
 * @param email: string
 * @param password: string
 *
 * @example
 * Request:
 * POST /api/v1/jwt/login
 * body: {"email": "xxx@outlook.com","password": "password"}
 * Response:
 * "data": {"accessToken": {"token": "xxxxx.yyyyy.zzzzz", "expireAt": "2000-01-01T00:00:00.000Z"}, "refreshToken": {"token": "xxxxx.yyyyy.zzzzz", "expireAt": "2000-01-01T00:00:00.000Z"}}
 */
jwtRouter.post("/login", async (req, res): Promise<any> => {
    // Process Request Body
    const {email, password} = req.body;
    if (!email || !password) {
        return res.status(400).json(errorResponse(400, "Credentials is required."));
    }

    // API Logic
    try {
        const user = new UserModel(null, email);
        const userExists = await user.fetchUser();
        if (!userExists || !await user.authenticateUser(password) || !user.uuid || !user.email) {
            return res.status(401).json(errorResponse(401, "Invalid credentials."));
        }

        return res.status(200).json(successResponse(req, {
            accessToken: {
                token: accessToken(user.uuid, user.email),
                expireAt: new Date(Date.now() + ACCESS_TOKEN_EXPIRY * 1000).toISOString()
            },
            refreshToken: {
                token: await refreshToken(user.uuid, user.email),
                expireAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY * 1000).toISOString()
            }
        }));
    } catch (error) {
        console.error(error);
        return res.status(500).json(errorResponse(500, "Internal server error."));
    }
});

/** Refresh JWT token by refresh token
 * POST /api/v1/jwt/refresh
 * @param token: string
 *
 * @example
 * Request:
 * /api/v1/jwt/refresh (POST)
 * body: {"refreshToken":<token>}
 * Response:
 * "data": {"accessToken": {"token": "xxxxx.yyyyy.zzzzz", "expireAt": "2000-01-01T00:00:00.000Z"}}
 */
jwtRouter.post("/refresh", async (req, res): Promise<any> => {
    // Process Request Body
    const refreshToken = req.body.token || req.body.refreshToken;
    if (!refreshToken) {
        return res.status(400).json(errorResponse(400, "Refresh token is required."));
    }

    // API Logic
    try {
        const payload = jwt.verify(refreshToken, JWT_SECRET) as JwtPayload;
        const storedToken = await redisGet(`refreshToken:${payload.sub}`);
        if (!storedToken || storedToken !== refreshToken) {
            return res.status(403).json(errorResponse(403, "Refresh token expired or invalid."));
        }

        return res.status(200).json(successResponse(req, {
            accessToken: {
                // Sign a new access token
                token: accessToken(payload.sub as string, payload.email),
                expireAt: new Date(Date.now() + ACCESS_TOKEN_EXPIRY * 1000).toISOString()
            }
        }));
    } catch (error) {
        console.error(error);
        return res.status(403).json(errorResponse(403, "Refresh token expired or invalid."));
    }
});

/** Logout by removing the refresh token
 * POST /api/v1/jwt/logout
 */
jwtRouter.post("/logout", async (req, res): Promise<any> => {
    // Process Request Body
    const refreshToken = req.body.token || req.body.refreshToken;
    if (!refreshToken) {
        return res.status(400).json(errorResponse(400, "Refresh token is required."));
    }

    // API Logic
    try {
        const payload = jwt.verify(refreshToken, JWT_SECRET) as JwtPayload;
        await redisSet(`refreshToken:${payload.sub}`, "", 0);
        return res.status(200).json(successResponse(req, {}, "Logout successful."));
    } catch (error) {
        console.error(error);
        return res.status(403).json(errorResponse(403, "Refresh token expired or invalid."));
    }
});

export default jwtRouter