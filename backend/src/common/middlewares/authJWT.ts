// /StackFusionZiyiliuTop/backend/src/common/util/authJWT.ts
import {RequestHandler} from "express";
import {errorResponse} from "@src/common/util/response";
import JwtService from "@src/services/JwtService";
import HttpStatusCodes from "@src/common/constants/HttpStatusCodes";
import UserService from "@src/services/UserService";
import {UserRoleEnum} from "@src/types";
import {isUuidV4} from "@src/common/util/validators";
import {isEmail} from "jet-validators";

// Authenticate any logged-in user via Bearer access token
export const requireUser: RequestHandler = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
        res.status(HttpStatusCodes.UNAUTHORIZED)
            .send(errorResponse(req, res, "Missing or malformed Authorization header", {authHeader}));
        return;
    }
    const token = authHeader.slice(7);
    let payload;
    try {
        payload = JwtService.verifyAccessToken(token);
    } catch (e) {
        res.status(HttpStatusCodes.UNAUTHORIZED)
            .send(errorResponse(req, res, "Invalid or expired token", (e as Error).message));
        return;
    }
    req.user = {uuid: payload.sub};
    next();
};

// Require user to have at least one of the allowed roles
export const _requireRoleOr = (allowedRoles: UserRoleEnum[]): RequestHandler =>
    async (req, res, next) => {
        const userId = req.user!.uuid;
        try {
            const ok = await UserService.hasRolesOr(userId, allowedRoles);
            if (!ok) {
                res.status(HttpStatusCodes.FORBIDDEN)
                    .send(errorResponse(req, res, "Insufficient role"));
                return;
            }
            next();
        } catch (e) {
            res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
                .send(errorResponse(req, res, "Error checking roles", (e as Error).message));
        }
    };

// Require user to have all of the allowed roles
export const _requireRoleAnd = (allowedRoles: UserRoleEnum[]): RequestHandler =>
    async (req, res, next) => {
        const userId = req.user!.uuid;
        try {
            const ok = await UserService.hasRolesAnd(userId, allowedRoles);
            if (!ok) {
                res.status(HttpStatusCodes.FORBIDDEN)
                    .send(errorResponse(req, res, "Insufficient role"));
                return;
            }
            next();
        } catch (e) {
            res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
                .send(errorResponse(req, res, "Error checking roles", (e as Error).message));
        }
    };

export const requireOwner = (
    key: string,
    excRoles: UserRoleEnum[],
): RequestHandler => async (req, res, next) => {
    // 1) Authenticate via Bearer token
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
        res.status(HttpStatusCodes.UNAUTHORIZED)
            .send(errorResponse(req, res, "Missing or malformed Authorization header", {authHeader}));
        return;
    }

    const token = authHeader.slice(7);
    let payload;
    try {
        payload = JwtService.verifyAccessToken(token);
    } catch (err) {
        res.status(HttpStatusCodes.UNAUTHORIZED)
            .send(errorResponse(req, res, "Invalid or expired token", (err as Error).message));
        return;
    }

    const requesterId = payload.sub;
    // Bypass check if user has any of the exception roles
    if (excRoles.length > 0) {
        try {
            const hasRole = await UserService.hasRolesOr(requesterId, excRoles);
            if (hasRole) return next();
        } catch (err) {
            res.status(HttpStatusCodes.FORBIDDEN)
                .send(errorResponse(req, res, "Forbidden", (err as Error).message));
            return;
        }
    }

    // 3) Extract the resource identifier
    let resourceIdentifier: unknown;
    if (req.params && typeof req.params[key] === "string") {
        resourceIdentifier = req.params[key];
    } else if (
        req.body &&
        typeof (req.body as Record<string, unknown>)[key] === "string"
    ) {
        resourceIdentifier = (req.body as Record<string, unknown>)[key];
    }

    if (
        typeof resourceIdentifier !== "string" ||
        resourceIdentifier.trim() === ""
    ) {
        res.status(HttpStatusCodes.BAD_REQUEST)
            .send(errorResponse(req, res, `Missing or invalid resource identifier '${key}'`));
        return;
    }

    // 4) Ownership validation
    if (isUuidV4(resourceIdentifier)) {
        if (resourceIdentifier !== requesterId) {
            res.status(HttpStatusCodes.FORBIDDEN)
                .send(errorResponse(req, res, "Forbidden"));
            return;
        }
        return next();
    }

    if (isEmail(resourceIdentifier)) {
        try {
            const owner = await UserService.getSelfProfile(
                undefined,
                resourceIdentifier,
            );
            if (!owner || owner.uuid !== requesterId) {
                res.status(HttpStatusCodes.FORBIDDEN)
                    .send(errorResponse(req, res, "Forbidden"));
                return;
            }
            return next();
        } catch (err) {
            res.status(HttpStatusCodes.FORBIDDEN)
                .send(errorResponse(req, res, "Forbidden", (err as Error).message));
            return;
        }
    }

    // Not a valid UUID or email
    res
        .status(HttpStatusCodes.BAD_REQUEST)
        .send(errorResponse(req, res, `Resource identifier '${key}' must be a UUID or e-mail`));
    return;
};