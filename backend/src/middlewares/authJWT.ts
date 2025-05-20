// /StackFusionZiyiliuTop/backend/src/middlewares/authJWT.ts
import {Request, Response, NextFunction} from "express"
import jwt, {JwtPayload} from "jsonwebtoken"
import {errorResponse} from "middlewares/response"
import {UserModel} from "models/user.model"
import {isUuidV4} from "utils/valid.util";
import {SERVER_TOKEN_KEY} from "../utils/jwt.util";

// env constants – keep naming consistent
const JWT_SECRET = process.env.JWT_SECRET_KEY!
const USER_ACCESS_COOKIE = process.env.USER_ACCESS_COOKIE_NAME!
const SERVER_ACCESS_COOKIE = process.env.SERVER_ACCESS_COOKIE_NAME!

//  extract token
function extractJWT(req: Request): JwtPayload | null {
    const token =
        req.cookies[USER_ACCESS_COOKIE]                                      // STT in cookie
        || req.header("Authorization")?.replace(/^Bearer\s+/i, "")          // LTT in header
        || req.cookies[SERVER_ACCESS_COOKIE]                               // ST in cookie

    if (!token) return null

    try {
        return jwt.verify(token, JWT_SECRET) as JwtPayload
    } catch {
        return null
    }
}

//  User token
export const authUsrJWT = async (req: Request, res: Response, next: NextFunction) => {
    const payload = extractJWT(req)
    if (!payload) {
        res.status(401).json(errorResponse(req, 401, "Invalid token"))
        return
    }

    try {
        const tokenUser = await new UserModel(payload.sub).fetchUser()
        if (!tokenUser) {
            res.status(401).json(errorResponse(req, 401, "Invalid token"))
            return
        }

        // **Attach** for downstream handlers / responses
        req.user = tokenUser
        next()
    } catch (e) {
        res.status(500).json(errorResponse(req, 500, "Internal server error"))
        return
    }
}

//  Admin only
export const authAdmJWT = async (req: Request, res: Response, next: NextFunction) => {
    const payload = extractJWT(req)
    if (!payload) {
        res.status(401).json(errorResponse(req, 401, "Invalid token"))
        return
    }

    try {
        const tokenUser = await new UserModel(payload.sub).fetchUser()
        console.warn("authAdmJWT: User is admin:" + String(payload.sub) + String(tokenUser!.email))
        if (!tokenUser || !tokenUser.isAdmin()) {
            res.status(403).json(errorResponse(req, 403, "Permission denied"))
            return
        }

        // **Attach** for downstream handlers / responses
        req.user = tokenUser
        next()
    } catch (e) {
        res.status(500).json(errorResponse(req, 500, "Internal server error"))
        return
    }
}

//  Owner **or** Admin
export const authCrsJWT = async (req: Request, res: Response, next: NextFunction) => {
    const payload = extractJWT(req)
    if (!payload) {
        res.status(401).json(errorResponse(req, 401, "Invalid token"))
        return
    }

    try {
        // Load the “resource” user (the :key in the URL)
        let resourceUser = req.user || null
        if (!resourceUser) {
            resourceUser = isUuidV4(req.params.key)
                ? (await new UserModel(req.params.key).fetchUser())!
                : (await new UserModel(null, req.params.key).fetchUser())!
            if (!resourceUser) {
                res.status(404).json(errorResponse(req, 404, "User not found:" + req.params.key))
                return
            }
        }

        const tokenUser = await new UserModel(payload.sub).fetchUser()
        if (!tokenUser) {
            res.status(401).json(errorResponse(req, 401, "Invalid token"))
            return
        }

        // Owner or admin?
        const isOwner = resourceUser.uuid === tokenUser.uuid
        const isAdmin = tokenUser.isAdmin()
        if (!isOwner && !isAdmin) {
            res.status(403).json(errorResponse(req, 403, "Permission denied"))
            return
        }

        // **Attach** both for your route
        req.user = tokenUser
        req.resourceUser = resourceUser
        next()
    } catch {
        res.status(500).json(errorResponse(req, 500, "Internal server error"))
        return
    }
}

//  Server token
export const authSvrJWT = (req: Request, res: Response, next: NextFunction) => {
    const payload = extractJWT(req)
    if (!payload) {
        res.status(401).json(errorResponse(req, 401, "Invalid token"))
        return
    } else if (payload.sub !== SERVER_TOKEN_KEY) {
        res.status(403).json(errorResponse(req, 403, "Permission denied"))
        return
    }
    next()
}
