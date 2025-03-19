// /StackFusionZiyiliuTop/backend/src/middlewares/response.ts
import {JwtPayload} from "jsonwebtoken";
import {Request} from "express";

const API_VERSION: string = process.env.API_VERSION || "N/A";
const AUTHOR: string = process.env.AUTHOR || "N/A";

const successResponse = (req: Request, data: object = {}, message: string = "OK", code: number = 200) => ({
    meta: {
        code: code,
        message: message,
        time: new Date().toISOString(),
        version: API_VERSION,
        author: AUTHOR,
        payload: req?.user
    }, data: data
});
const errorResponse = (errorCode: number, message: string, errorDetails: object = {}) => ({
    meta: {
        code: errorCode,
        message: message,
        time: new Date().toISOString(),
        version: API_VERSION,
        author: AUTHOR,
    }, error: errorDetails || null
});

export {successResponse, errorResponse};