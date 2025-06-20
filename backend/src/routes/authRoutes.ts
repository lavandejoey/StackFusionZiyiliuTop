// /StackFusionZiyiliuTop/backend/src/routes/authRoutes.ts
import {Router} from "express";
import UserService from "@src/services/UserService";
import JwtService from "@src/services/JwtService";
import Paths from "@src/common/constants/Paths";
import {REFRESH_TOKEN_PREFIX} from "@src/common/constants/ENV";
import {errorResponse, successResponse} from "@src/common/util/response";
import {isEmail} from "jet-validators";
import HttpStatusCodes from "@src/common/constants/HttpStatusCodes";
import jwtService from "@src/services/JwtService";
import {requireUser} from "@src/common/middlewares/authJWT";
import {UserCreateModel, UserModel} from "@src/types/users";
import {isUuidV4} from "@src/common/util/validators";

export const authRouter = Router();

/**
 * Login and token issue.
 * POST /api/${API_VERSION}/auth/login?email=${email}&password=${password}
 * @return {object} : {accessToken: string, user: UserModel}
 */
authRouter.post(Paths.Auth.Login, async (req, res) => {
    try {
        // Input Validation
        const {email, password} = req.query as { email?: string, password?: string };
        if (!email || !password || !isEmail(email)) {
            res.status(HttpStatusCodes.BAD_REQUEST).send(errorResponse(req, res, "Invalid input"));
            return;
        }

        // Credential Check
        const {accessToken, refreshToken, user} = await UserService.loginUser(email, password);

        // Refresh Token -> Cookie
        JwtService.setRefreshTokenCookie(res, refreshToken);
        // Access Token -> Response
        res.status(HttpStatusCodes.OK).send(successResponse(req, res, {accessToken, user}, "Login successful"));
    } catch (err) {
        res
            .status(HttpStatusCodes.UNAUTHORIZED)
            .send(errorResponse(req, res, "Credentials are invalid", (err as Error).message));
    }
});

/**
 * Logout and clear cookies.
 * POST /api/${API_VERSION}/auth/logout
 * @return {void}
 */
authRouter.post(Paths.Auth.Logout, (req, res) => {
    JwtService.clearRefreshTokenCookie(res);
    res.status(204).send(); // No Content
});

/**
 * Refresh access token using refresh token.
 * POST /api/${API_VERSION}/auth/refresh
 * @return {object} : {accessToken: string}
 */
authRouter.post(Paths.Auth.Refresh, async (req, res) => {
    try {
        const cookies = req.cookies as Record<string, string>;
        const tokenValue = cookies[REFRESH_TOKEN_PREFIX] ?? "";
        if (!tokenValue) {
            res.status(401)
                .send(errorResponse(req, res, "Login failed", "Invalid or missing refresh token"));
            return;
        }

        const {accessToken, refreshToken} = await JwtService.rotateRefreshToken(tokenValue);
        // Set the new refresh token cookie
        JwtService.setRefreshTokenCookie(res, refreshToken);
        res.status(200).send(successResponse(req, res, {accessToken}));
    } catch (err) {
        res.clearCookie(REFRESH_TOKEN_PREFIX);
        res.status(401).send(errorResponse(req, res, "Login failed", (err as Error).message));
    }
});

/**
 * Retrieve self profile.
 * GET /api/${API_VERSION}/auth/me
 * @return {UserModel} The user's profile.
 */
authRouter.get(Paths.Auth.Me, requireUser, async (req, res) => {
    try {
        // by jwt in header
        const token = req.headers.authorization?.split(" ")?.[1];
        if (!token) {
            res.status(HttpStatusCodes.UNAUTHORIZED).send(errorResponse(req, res, "Missing token"));
            return;
        }
        const userId = jwtService._decode(token).sub;
        const userProfile = await UserService.getSelfProfile(userId);
        if (!userProfile) {
            res.status(HttpStatusCodes.NOT_FOUND).send(errorResponse(req, res, "User not found"));
            return;
        }
        res.status(HttpStatusCodes.OK).send(successResponse(req, res, userProfile));
    } catch (err) {
        res
            .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
            .send(errorResponse(req, res, "Failed to retrieve profile", (err as Error).message));
    }
});

/**
 * Signup a new user.
 * POST /api/${API_VERSION}/auth/signup?
 * email=${email}&password=${password}&first_name=${first_name}&last_name=${last_name}
 * @return {object} : {accessToken: string, user: UserModel}
 */
authRouter.post(Paths.Auth.Signup, async (req, res) => {
    try {
        // Input Validation
        const {email, password, first_name, last_name} = req.query as {
            email?: string,
            password?: string,
            first_name?: string,
            last_name?: string,
        };
        if (!email || !password || !first_name || !last_name || !isEmail(email)) {
            res.status(HttpStatusCodes.BAD_REQUEST).send(errorResponse(req, res, "Invalid input"));
            return;
        }

        // Create User
        const new_user = await UserService.insertUser({email, password, first_name, last_name} as UserCreateModel);
        if (!new_user) {
            res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send(errorResponse(req, res, "Failed to create user"));
            return;
        }
        // Issue Tokens
        const {accessToken, refreshToken} = await UserService.issueTokens(new_user.uuid);

        // Refresh Token -> Cookie
        JwtService.setRefreshTokenCookie(res, refreshToken);
        // Access Token -> Response
        res.status(HttpStatusCodes.CREATED).send(successResponse(req, res, {
            accessToken,
            user: new_user,
        }, "Signup successful"));
    } catch (err) {
        res
            .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
            .send(errorResponse(req, res, "Failed to create user", (err as Error).message));
    }
});

/**
 * User exists check.
 * GET /api/${API_VERSION}/auth/exists?email=${email}
 * GET /api/${API_VERSION}/auth/exists?uuid=${uuid}
 * @return {object} : {exists: boolean}
 */
authRouter.get(Paths.Auth.Exists, async (req, res) => {
    try {
        const {email, uuid} = req.query as { email?: string, uuid?: string };

        // Check User Existence, using UserService.getSelfProfile
        let user: UserModel;
        if (email && isEmail(email)) {
            user = await UserService.getSelfProfile(undefined, email);
        } else if (uuid && isUuidV4(uuid)) {
            user = await UserService.getSelfProfile(uuid);
        } else {
            res.status(HttpStatusCodes.BAD_REQUEST).send(errorResponse(req, res, "Invalid input"));
            return;
        }

        // Return response
        res.status(HttpStatusCodes.OK).send(successResponse(req, res, {exists: !!user}, "User existence checked"));
    } catch (err) {
        const error = err as Error;
        if (error.message === "User not found") {
            res.status(HttpStatusCodes.OK).send(successResponse(req, res, {exists: false}, "User existence checked"));
            return;
        }
        res
            .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
            .send(errorResponse(req, res, "Failed to check user existence", (err as Error).message));
    }
});