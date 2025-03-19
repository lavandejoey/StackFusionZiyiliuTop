// /StackFusionZiyiliuTop/backend/src/types/express/index.d.ts
import {Request} from "express";
import {UserModel} from "models/user.model";

declare module "express-serve-static-core" {
    interface Request {
        user?: UserModel | null;
    }
}
