// /StackFusionZiyiliuTop/backend/src/routes/userRoutes.ts
import {Router} from "express";
import {requireOwner} from "@src/common/middlewares/authJWT";
import UserService from "@src/services/UserService";
import {errorResponse, successResponse} from "@src/common/util/response";
import HttpStatusCodes from "@src/common/constants/HttpStatusCodes";
import {UserModel, UserRoleEnum} from "@src/types/users";
import {isUuidV4} from "@src/common/util/validators";
import {ENDPOINTS} from "@src/common/constants/ENDPOINTS";

export const userRouter = Router();

/**
 * Fetches a user by their UUID.
 * GET /api/${version}/users/:uuid
 * @param {string} uuid - The UUID of the user to fetch.
 * @returns {UserModel} - The user data.
 */
userRouter.get(
    ENDPOINTS.users.getByUuid,
    requireOwner("uuid", [UserRoleEnum.USER_MANAGER, UserRoleEnum.ADMIN]),
    async (req, res) => {
        const userId = req.params.uuid;
        if (!userId || !isUuidV4(userId)) {
            res.status(HttpStatusCodes.BAD_REQUEST).send(errorResponse(req, res, "Invalid UUID"));
            return;
        }

        try {
            const userAndRoles: UserModel & { roles: UserRoleEnum[] } = await UserService.getSelfProfile(userId);
            if (!userAndRoles) {
                res.status(HttpStatusCodes.NOT_FOUND).send(errorResponse(req, res, "User not found"));
                return;
            }
            res.status(HttpStatusCodes.OK).send(successResponse(req, res, userAndRoles));
        } catch (err) {
            res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
                .send(errorResponse(req, res, "Failed to fetch user", (err as Error).message));
        }
    });