// /StackFusionZiyiliuTop/backend/src/common/util/response.ts
import {Request, Response, NextFunction} from "express";
import {v4 as uuidv4} from "uuid";
import {API_VERSION, AUTHOR} from "@src/common/constants/ENV";

export const attachReqId = (
    req: Request, _res: Response, next: NextFunction) => {
    req.id = req.id ?? uuidv4();
    next();
};

interface MetaBase {
    id: string;                       // request-id for tracing
    code: number;                     // HTTP status
    message: string;                  // human message
    time: string;                     // ISO-8601 UTC
    version: string;                  // API version
    author: string;                   // team / service id
    path: string;                     // original URL
    payload: string;                 // optional user uuid
}

const createMeta = (req: Request, res: Response, message: string, defaultCode: number): MetaBase => ({
    id: req.id ?? "N/A",
    code: res?.statusCode ?? defaultCode,
    message,
    time: new Date().toISOString(),
    version: API_VERSION,
    author: AUTHOR,
    path: req.originalUrl,
    payload: req.user?.uuid ?? "",
});

export const successResponse =
    <T = unknown>(req: Request, res: Response, data: T, message = "OK") => ({
        meta: createMeta(req, res, message, 200),
        data,
    });

export const errorResponse = (
    req: Request, res: Response, message: string, details: unknown = null,
) => ({
    meta: createMeta(req, res, message, 500),
    error: details,
});