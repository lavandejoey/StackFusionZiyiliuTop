// /StackFusionZiyiliuTop/backend/src/middlewares/authJWT.ts
import {NextFunction, Request, Response} from "express";
import jwt, {JwtPayload} from "jsonwebtoken";
import {UserModel} from "models/user.model";

const JWT_SECRET: string = process.env.JWT_SECRET_KEY || "secret";

const authJWT = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({meta: {code: 401, message: "No token provided.", time: new Date().toISOString()}});
        return;
    }

    try {
        // verify the token
        const payload = jwt.verify(authHeader.split(' ')[1], JWT_SECRET) as JwtPayload;
        req.user = new UserModel(payload.sub, payload.email);
        next();
    } catch (error) {
        res.status(403).json({meta: {code: 403, message: 'Invalid token.', time: new Date().toISOString()}});
        return;
    }
};

export {authJWT};