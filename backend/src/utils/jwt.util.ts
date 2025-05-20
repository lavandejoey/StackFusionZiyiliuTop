// /StackFusionZiyiliuTop/backend/src/utils/jwt.util.ts
import {Response} from "express";
import {randomUUID} from "crypto";
import jwt, {JwtPayload} from "jsonwebtoken";
import {redisSet} from "@/utils/redisClient.util";
import process from "node:process";

// env constants – keep naming consistent
const JWT_SECRET = process.env.JWT_SECRET_KEY!
export const SERVER_TOKEN_KEY = process.env.SERVER_TOKEN_KEY!
const SERVER_TOKEN_EXPIRY = Number(process.env.SERVER_TOKEN_EXPIRY)!

export const buildPayload = (sub: string): JwtPayload => ({
    iss: process.env.DOMAIN!, // issuer
    sub, // subject
    exp: Math.floor(Date.now() / 1000) + Number(process.env.ACCESS_TOKEN_EXPIRY), // expiry
    nbf: Math.floor(Date.now() / 1000), // not before
    iat: Math.floor(Date.now() / 1000), // issued at
    jti: randomUUID(), // JWT ID
})

// Generate a new user short term token STT
export async function signUserToken(uuid: string) {
    const payload = buildPayload(uuid)
    const token = jwt.sign(payload, JWT_SECRET)
    await redisSet(uuid, token, Number(process.env.ACCESS_TOKEN_EXPIRY));
    return token
}

// Generate a new Server token
export async function signServerToken() {
    const token = jwt.sign(buildPayload(SERVER_TOKEN_KEY), JWT_SECRET)
    await redisSet(SERVER_TOKEN_KEY, token, SERVER_TOKEN_EXPIRY)
    return token
}

// cookie helper
export const setAuthCookie = (
    res: Response,
    name: string,
    token: string,
    maxAgeSeconds: number,
) =>
    res.cookie(name, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: maxAgeSeconds * 1000,
    });
