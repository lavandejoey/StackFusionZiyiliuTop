// /StackFusionZiyiliuTop/backend/src/middlewares/authJWT.ts
import {NextFunction, Request, Response} from "express";
import jwt, {JwtPayload} from "jsonwebtoken";
import {UserModel} from "models/user.model";

const JWT_SECRET: string = process.env.JWT_SECRET_KEY || "secret";

// Higher-order function for role-based auth
function authMiddleware(authRule?: (user: UserModel, req?: Request) => boolean) {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            res.status(401).json({
                meta: {code: 401, message: "No token provided.", time: new Date().toISOString()}
            });
            return;
        }


        try {
            const payload = jwt.verify(authHeader.split(' ')[1], JWT_SECRET) as JwtPayload;

            // Initialize user
            const user = new UserModel(payload.sub, payload.email);
            await user.fetchUser();
            req.user = user;

            // If there's an auth rule, validate it
            if (authRule && !authRule(user, req)) {
                res.status(403).json({
                    meta: {code: 403, message: "Permission denied.", time: new Date().toISOString()}
                });
                return;
            }

            next();
        } catch (error) {
            res.status(403).json({meta: {code: 403, message: "Invalid token.", time: new Date().toISOString()}});
            return;
        }
    };
}

// Basic JWT auth (any valid token)
const authJWT = authMiddleware();
// Admin-only auth
const authAdminJWT = authMiddleware((user) => user.isAdmin());
// Self or Admin auth: check user UUID in token matches param or is admin
const authSelfOrAdminJWT = authMiddleware((user, req) => {
    const targetUuid = req?.body?.uuid || req?.query?.uuid;
    if (!targetUuid) return false;
    return user.isAdmin() || user.uuid === targetUuid;
});

export {authJWT, authAdminJWT, authSelfOrAdminJWT};
