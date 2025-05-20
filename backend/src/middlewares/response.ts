// /StackFusionZiyiliuTop/backend/src/middlewares/response.ts
import {Request, Response, NextFunction} from "express";
// import {v4 as uuidv4} from "uuid";

const API_VERSION = process.env.API_VERSION ?? "N/A";
const AUTHOR = process.env.AUTHOR ?? "N/A";

export const attachReqId = (req: Request, _res: Response, next: NextFunction) => {
    // req.id = uuidv4();
    next();
};

interface MetaBase {
    // id: string;                       // request-id for tracing
    code: number;                     // HTTP status
    message: string;                  // human message
    time: string;                     // ISO-8601 UTC
    version: string;                  // API version
    author: string;                   // team / service id
    path: string;                     // original URL
    payload?: string;                 // optional user uuid
}

export const successResponse = <T = unknown>(
    req: Request,
    data: T,
    message = "OK",
    code = 200,
) => ({
    meta: {
        // id: req.id as string,
        code,
        message,
        time: new Date().toISOString(),
        version: API_VERSION,
        author: AUTHOR,
        path: req.originalUrl,
        payload: (req.user as any)?.uuid,
    } satisfies MetaBase,
    data,
});

export const errorResponse = (
    req: Request,
    code: number,
    message: string,
    details: unknown = null,
) => ({
    meta: {
        // id: req.id as string,
        code,
        message,
        time: new Date().toISOString(),
        version: API_VERSION,
        author: AUTHOR,
        path: req.originalUrl,
    } satisfies MetaBase,
    error: details,
});
