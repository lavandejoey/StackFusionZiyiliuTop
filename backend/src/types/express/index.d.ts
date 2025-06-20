// /StackFusionZiyiliuTop/backend/src/types/express/index.d.ts
import {UserModel, AuthUser} from "@src/types/users";

declare module "express-serve-static-core" {
    interface Request extends Request {
        id?: string;
        user?: AuthUser; // Changed from UserModel to AuthUser
        resourceUser?: UserModel;
    }
}