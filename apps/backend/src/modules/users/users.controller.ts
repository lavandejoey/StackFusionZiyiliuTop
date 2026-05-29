// /StackFusionZiyiliuTop/backend/src/routes/userRoutes.ts
import { Router } from "express";
import { requireOwner } from "@src/common/middlewares/authJWT";
import UserService from "@src/modules/users/users.service";
import { errorResponse, successResponse } from "@src/common/util/response";
import HttpStatusCodes from "@src/common/constants/HttpStatusCodes";
import { UserModel, UserRoleEnum } from "@src/types/users";
import { isUuidV4 } from "@src/common/util/validators";
import { ENDPOINTS } from "@src/common/constants/ENDPOINTS";

export const userRouter = Router();

/**
 * List all users with roles (Admin only).
 * GET /api/${version}/users/all?offset=${offset}&limit=${limit}
 * @param {number} offset - The number of items to skip before starting to collect the result set.
 * @param {number} limit - The number of items to return.
 * @returns {UserModel[]} - The list of users with their roles.
 */
userRouter.get(
    ENDPOINTS.users.list[1],
    requireOwner(null, [UserRoleEnum.ADMIN]),
    async (req, res) => {
        const offset = parseInt(req.query.offset as string) || 0;
        const limit = parseInt(req.query.limit as string) || 20;

        try {
            if (!req.user?.roles) {
                res.status(HttpStatusCodes.FORBIDDEN).send(errorResponse(req, res, "Forbidden"));
                return;
            }
            const users: UserModel[] = await UserService.listAllUsers({ offset, limit }, req.user.roles);
            res.status(HttpStatusCodes.OK).send(successResponse(req, res, users));
        } catch (err) {
            res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
                .send(errorResponse(req, res, "Failed to list users", (err as Error).message));
        }
    });

// Optional root list route for backwards compatibility
userRouter.get(
    ENDPOINTS.users.list[0],
    requireOwner(null, [UserRoleEnum.ADMIN]),
    async (req, res) => {
        const offset = parseInt(req.query.offset as string) || 0;
        const limit = parseInt(req.query.limit as string) || 20;

        try {
            if (!req.user?.roles) {
                res.status(HttpStatusCodes.FORBIDDEN).send(errorResponse(req, res, "Forbidden"));
                return;
            }
            const users: UserModel[] = await UserService.listAllUsers({ offset, limit }, req.user.roles);
            res.status(HttpStatusCodes.OK).send(successResponse(req, res, users));
        } catch (err) {
            res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
                .send(errorResponse(req, res, "Failed to list users", (err as Error).message));
        }
    });

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

/**
 * List user's roles by their UUID.
 * GET /api/${version}/users/:uuid/roles
 * @param {string} uuid - The UUID of the user whose roles to fetch.
 * @returns {UserRoleEnum[]} - The list of roles associated with the user.
 */
userRouter.get(
    ENDPOINTS.users.listRolesByUserUuid,
    requireOwner("uuid", [UserRoleEnum.USER_MANAGER, UserRoleEnum.ADMIN]),
    async (req, res) => {
        const userId = req.params.uuid;
        if (!userId || !isUuidV4(userId)) {
            res.status(HttpStatusCodes.BAD_REQUEST).send(errorResponse(req, res, "Invalid UUID"));
            return;
        }

        try {
            const roles: UserRoleEnum[] = await UserService.getUserRoles(userId);
            res.status(HttpStatusCodes.OK).send(successResponse(req, res, roles));
        } catch (err) {
            res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
                .send(errorResponse(req, res, "Failed to fetch user roles", (err as Error).message));
        }
    });

