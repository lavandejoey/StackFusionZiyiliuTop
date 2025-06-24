// /StackFusionZiyiliuTop/backend/src/services/JwtService.ts
import {Response} from "express";
import jwt from "jsonwebtoken";
import {v4 as uuidv4} from "uuid";
import {redisClient} from "@src/common/util/redisClient";
import {
    ACCESS_TOKEN_EXPIRY_MS,
    DOMAIN as JWT_ISSUER,
    NODE_ENV,
    REFRESH_TOKEN_EXPIRY_MS,
    REFRESH_TOKEN_PREFIX,
    SECRET_KEY as JWT_SECRET_KEY,
} from "@src/common/constants/ENV";
import {TokenPayload} from "@src/types/token";
import {ENDPOINTS} from "@src/common/constants/ENDPOINTS";


class JwtService {
    private issuer = JWT_ISSUER;
    private secret = JWT_SECRET_KEY;
    private accessTokenExpiryMs = ACCESS_TOKEN_EXPIRY_MS;
    private refreshTokenExpiryMs = REFRESH_TOKEN_EXPIRY_MS;
    private refreshCookieName = REFRESH_TOKEN_PREFIX;
    private cookieOptions = {
        httpOnly: true,
        secure: NODE_ENV === "production",
        sameSite: "lax" as const,
        domain: JWT_ISSUER,
        path: `${ENDPOINTS.base}${ENDPOINTS.auth.base}${ENDPOINTS.auth.refreshToken}`,
        maxAge: REFRESH_TOKEN_EXPIRY_MS,
    };

    /**
     * Generate a signed access token
     */
    public signAccessToken(sub: string): string {
        const jti = uuidv4();
        const expiresIn = Math.floor(this.accessTokenExpiryMs / 1000);
        return jwt.sign({sub, jti}, this.secret, {
            algorithm: "HS256",
            issuer: this.issuer,
            expiresIn,
            notBefore: 0,
        });
    }

    /**
     * Generate a signed refresh token and store its jti in Redis
     */
    public async signRefreshToken(sub: string): Promise<string> {
        const jti = uuidv4();
        const expiresIn = Math.floor(this.refreshTokenExpiryMs / 1000);
        const token = jwt.sign({sub, jti}, this.secret, {
            algorithm: "HS256",
            issuer: this.issuer,
            expiresIn,
            notBefore: 0,
        });
        await redisClient.set(
            `${REFRESH_TOKEN_PREFIX}:${jti}`,
            "1",
            "EX",
            expiresIn,
        );
        return token;
    }

    /**
     * Attach a refresh token cookie to the response
     */
    public setRefreshTokenCookie(res: Response, token: string): void {
        res.cookie(this.refreshCookieName, token, this.cookieOptions);
    }

    /**
     * Remove the refresh token cookie from the client
     */
    public clearRefreshTokenCookie(res: Response): void {
        res.clearCookie(this.refreshCookieName, this.cookieOptions);
    }

    /**
     * Verify an access token and return its payload
     */
    public verifyAccessToken(token: string): TokenPayload {
        return jwt.verify(token, this.secret, {
            issuer: this.issuer,
        }) as TokenPayload;
    }

    /**
     * Verify a refresh token and ensure its jti is still present in Redis
     */
    public async verifyRefreshToken(token: string): Promise<TokenPayload> {
        const payload = jwt.verify(token, this.secret, {
            issuer: this.issuer,
        }) as TokenPayload;
        const exists = await redisClient.get(
            `${REFRESH_TOKEN_PREFIX}:${payload.jti}`,
        );
        if (!exists) throw new Error("Invalid or expired refresh token");
        return payload;
    }

    /**
     * Rotate a refresh token: revoke the old one, issue new tokens, and set cookie
     */
    public async rotateRefreshToken(
        oldToken: string,
    ): Promise<{ accessToken: string, refreshToken: string }> {
        // Verify and revoke old refresh token
        const payload = await this.verifyRefreshToken(oldToken);
        await redisClient.del(`${REFRESH_TOKEN_PREFIX}:${payload.jti}`);
        // Issue new tokens
        const accessToken = this.signAccessToken(payload.sub);
        const refreshToken = await this.signRefreshToken(payload.sub);
        return {accessToken, refreshToken};
    }

    /**
     * Decode a token without verifying signature
     */
    public _decode(token: string): TokenPayload {
        return jwt.decode(token) as TokenPayload;
    }
}

export default new JwtService();
