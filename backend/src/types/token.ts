// /StackFusionZiyiliuTop/backend/src/types/token/index.d.ts
import {JwtPayload} from "jsonwebtoken";

export interface TokenPayload extends JwtPayload {
    iss: string;   // issuer, JWT_ISSUER
    sub: string;   // user UUID
    iat: number;   // issued at, seconds since epoch
    nbf: number;   // not before, seconds since epoch
    exp: number;   // expiration time, seconds since epoch
    jti: string;   // unique token identifier
}
