// /StackFusionZiyiliuTop/backend/src/api/v1/userRouter.ts
import {CookieOptions, Router} from "express"
import {UserModel, UserRow} from "@/models/user.model"
import {successResponse, errorResponse} from "@/middlewares/response"
import {authAdmJWT, authCrsJWT, authSvrJWT, authUsrJWT} from "@/middlewares/authJWT"
import {setAuthCookie, signUserToken} from "@/utils/jwt.util";
import {isUuidV4} from "@/utils/valid.util";

const userRouter = Router()

/** Retrieve all users. Admin, Cookie STT / Header LTT
 *  Request: GET /api/v1/user/all
 *  Header: {Authorization "Bearer ${LTT}"}
 *  Response 200: "data": [{
 *      "uuid": "xxx",
 *      "email": "xxx@xxx.com",
 *      "username": "xxx",
 *      "role": [],
 *      "created_at": "2000-01-01T00:00:00.000Z",
 *      "updated_at": "2000-01-01T00:00:00.000Z"
 *  }]
 */
userRouter.get("/all", authAdmJWT, async (req, res) => {
    const allUsers: UserRow[] = await UserModel.fetchAllUsers()
    if (allUsers && allUsers.length > 0) res.json(successResponse(req, allUsers))
    else res.status(404).json(errorResponse(req, 404, "No users found."))
})

/** Retrieve current user. Cookie STT / Header LTT
 *  Request: GET /api/v1/user/me
 *  Header: {Authorization "Bearer ${LTT}"}
 *  Response 200: "data": {
 */
userRouter.get("/me", authUsrJWT, async (req, res) => {
    res.status(200).json(successResponse(req, req.user!, "User retrieved successfully."))
})

/** Create a new user. Server ST
 *  Request: POST /api/v1/user/signup
 *  Header: {Authorization "Bearer ${ST}"}
 *  Body: {"firstName": "John", "lastName": "Doe", "email": "xxx@xxx.com", "password": "password"}
 *  Response 200: "data": {
 *      "uuid": "xxx",
 *      "email": "xxx@xxx.com",
 *      "username": "xxx",
 *      "role": [],
 *      "created_at": "2000-01-01T00:00:00.000Z",
 *      "updated_at": "2000-01-01T00:00:00.000Z"
 *  }
 */
userRouter.post("/signup", authSvrJWT, async (req, res) => {
    const {firstName, lastName, email, password} = req.body
    if (!firstName || !lastName || !email || !password) {
        res.status(400).json(errorResponse(req, 400, "All fields required."))
        return
    }
    try {
        const user = new UserModel(null, email)
        const newUser = await user.createUser(undefined, email, password, firstName, lastName)
        if (!newUser) {
            res.status(400).json(errorResponse(req, 400, "User already exists."))
            return
        }

        // issue short term token with ACCESS_TOKEN_EXPIRY
        const token = await signUserToken(user.uuid!)
        setAuthCookie(res, process.env.USER_ACCESS_COOKIE_NAME!, token, Number(process.env.ACCESS_TOKEN_EXPIRY)!)

        res.status(200).json(successResponse(req, user, "User created successfully."))
    } catch (err) {
        console.error(err)
        res.status(500).json(errorResponse(req, 500, "Internal error."))
    }
})

/** Update a new user. Admin, Cookie STT / Header LTT
 *  Admin: Update any user email?, passwdHash?, firstName?, lastName?
 *  Correspond: Update own email?, passwdHash?, firstName?, lastName?
 *  Request: PATCH /api/v1/user/:uuid
 *  Header: {Authorization "Bearer ${ST}"}
 *  Body: {
 *      "firstName": "John", "lastName": "Doe", "email": "xxx@xxx.com", "oldPassword": "password", "newPassword": "newPassword"
 *  }
 *  Response 200: "data": {
 *      "uuid": "xxx",
 *      "email": "xxx@xxx.com",
 *      "username": "xxx",
 *      "role": [],
 *      "created_at": "2000-01-01T00:00:00.000Z",
 *      "updated_at": "2000-01-01T00:00:00.000Z"
 *  }
 */
userRouter.patch("/:uuid", authCrsJWT, async (req, res) => {
        const {uuid} = req.params;
        const {firstName, lastName, email, oldPassword, newPassword} = req.body;

        // 1) Validate UUID
        if (!isUuidV4(uuid)) {
            res.status(400).json(errorResponse(req, 400, "Invalid UUID format."));
            return
        }

        // 2) req.resourceUser is set by authCrsJWT as the target user
        const target: UserModel | undefined = (req as any).resourceUser;
        if (!target) {
            res.status(404).json(errorResponse(req, 404, "User not found."));
            return
        }

        try {
            // 3) If password change requested, verify oldPassword first
            if (oldPassword || newPassword) {
                if (!oldPassword || !newPassword) {
                    res.status(400).json(errorResponse(req, 400, "Both oldPassword and newPassword are required to change password."));
                    return
                }
                const ok = await target.authenticateUser(oldPassword);
                if (!ok) {
                    res.status(400).json(errorResponse(req, 400, "Old password is incorrect."));
                    return
                }
                await target.updatePassword(newPassword);
            }

            // 4) Collect any profile fields to update
            const updates: Partial<{
                email: string;
                first_name: string;
                last_name: string;
            }> = {};
            if (email) updates.email = email;
            if (firstName) updates.first_name = firstName;
            if (lastName) updates.last_name = lastName;

            // 5) If there’s anything to update, call the model
            if (Object.keys(updates).length > 0) {
                await target.updateProfile(updates);
            }

            // 6) Re-fetch fresh row and return
            const refreshed = (await target.fetchUser())!;
            res.status(200).json(successResponse(req, refreshed, "User updated successfully."));
            return
        } catch (err: any) {
            console.error("Error updating user:", err);

            // Handle duplicate‐email conflict
            if (err.code === "ER_DUP_ENTRY") {
                res.status(409).json(errorResponse(req, 409, "Email already in use."));
                return
            }

            res.status(500).json(errorResponse(req, 500, "Internal server error."));
            return
        }
    }
);

/** Check if user exists by email. Public API
 *  Request: GET /api/v1/user/exists?email={...@...com}
 */
userRouter.get("/exists", async (req, res) => {
    const email = (req.query.email as string | undefined)?.toLowerCase();
    if (!email) {
        res.status(400).json({exists: false});
        return
    }

    const u = await new UserModel(null, email).fetchUser();
    res.json({exists: Boolean(u)});
});

/** Retrieve user by UUID / Email. Admin, Correspond, Cookie STT / Header LTT
 *  Request: GET /api/v1/user/:key
 *  Header: {Authorization "Bearer ${LTT}"}
 *  Response 200: "data": {
 *      "uuid": "xxx",
 *      "email": "xxx@xxx.com",
 *      "username": "xxx",
 *      "role": [],
 *      "created_at": "2000-01-01T00:00:00.000Z",
 *      "updated_at": "2000-01-01T00:00:00.000Z"
 *  }
 */
userRouter.get("/:key", authCrsJWT, async (req, res) => {
    const {key} = req.params
    // Fetch user by UUID or Email
    const user = await (
        isUuidV4(key) ? new UserModel(key) : new UserModel(null, key)
    ).fetchUser() ?? null;

    if (user) res.status(200).json(successResponse(req, user))
    else res.status(404).json(errorResponse(req, 404, "User not found."))
    return
})

export default userRouter
