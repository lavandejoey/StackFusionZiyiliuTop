// /StackFusionZiyiliuTop/backend/src/api/v1/userRouter.ts
import {Router} from 'express'
import {successResponse, errorResponse} from "middlewares/response";
import {UserModel, UserRow} from "models/user.model";
import {authJWT} from "middlewares/authJWT";

const userRouter = Router()

/** Retrieve all users
 * GET /api/v1/user/all-user
 * @example
 * Request:
 * GET /api/v1/user/all-user
 * body: {}
 * Response:
 * "data": [{"uuid": "xxxxx", "email": "xxx@xxx.com", "username": "xxx", "role": [], "created_at": "2000-01-01T00:00:00.000Z", "updated_at": "2000-01-01T00:00:00.000Z"}]
 */
userRouter.get("/all-user", authJWT, async (req, res) => {
    const allUsers: UserRow[] = await UserModel.fetchAllUsers();
    if (allUsers && allUsers.length > 0) res.json(successResponse(req, allUsers));
    else res.json(errorResponse(404, "No users found."));
});

/** Retrieve user by UUID
 * GET /api/v1/user/:uuid
 * @param uuid: string
 * @example
 * Request:
 * GET /api/v1/user/xxxxx
 * body: {}
 * Response:
 * "data": {"uuid": "xxxxx", "email": "xxx@xxx.com", "username": "xxx", "role": [], "created_at": "2000-01-01T00:00:00.000Z", "updated_at": "2000-01-01T00:00:00.000Z"}
 */
userRouter.get("/:uuid", authJWT, async (req, res) => {
    const user: UserModel | null = await new UserModel(req.params.uuid).fetchUser();
    if (user) res.json(successResponse(req, user));
    else res.json(errorResponse(404, "User not found."));
});

export default userRouter
