// /StackFusionZiyiliuTop/backend/src/services/UserService.ts
import {Response} from "express";
import UserRepo from "@src/repos/UserRepo";
import {isUuidV4} from "@src/common/util/validators";
import {isEmail} from "jet-validators";
import {hashPassword} from "@src/common/util/argon2";
import JwtService from "@src/services/JwtService";
import {UserRoleEnum, UserModel, UserCreateModel, UserStatusEnum} from "@src/types/users";
import {redisClient} from "@src/common/util/redisClient";
import {REFRESH_TOKEN_PREFIX} from "@src/common/constants/ENV";
import crypto from "crypto";

interface UserService {
    /******************** Auth ********************/
    issueTokens(userId: string): Promise<{ accessToken: string, refreshToken: string }>;

    refreshAccessToken(res: Response, oldRefreshToken: string): Promise<{ accessToken: string, refreshToken: string }>;

    loginUser(email: string, password: string): Promise<{
        accessToken: string,
        refreshToken: string,
        user: UserModel,
    }>;

    insertUser(user: UserCreateModel): Promise<UserModel | null>;

    logoutUser(res: Response, refreshToken: string): Promise<void>;

    hasRolesOr(userId: string, needRoles: UserRoleEnum[]): Promise<boolean>;

    hasRolesAnd(userId: string, needRoles: UserRoleEnum[]): Promise<boolean>;

    /******************** Profile ********************/
    getSelfProfile(userId?: string, email?: string): Promise<(UserModel & { roles: UserRoleEnum[] }) | null>;

    updateSelfPassword(userId: string, oldPwd: string, newPwd: string): Promise<void>;

    /******************** Admin only ********************/
    listAllUsers(
        pager: { offset: number, limit: number },
        callerRoles: UserRoleEnum[]
    ): Promise<UserModel[]>;
}

class UserServiceImpl implements UserService {
    /******************** Auth ********************/
    public async issueTokens(userId: string) {
        const accessToken = JwtService.signAccessToken(userId);
        const refreshToken = await JwtService.signRefreshToken(userId);
        return {accessToken, refreshToken};
    }

    public async refreshAccessToken(res: Response, oldRefreshToken: string) {
        const {accessToken, refreshToken} = await JwtService.rotateRefreshToken(oldRefreshToken);
        return {accessToken, refreshToken};
    }

    public async loginUser(email: string, password: string): Promise<{
        accessToken: string,
        refreshToken: string,
        user: UserModel,
    }> {
        if (!isEmail(email)) throw new TypeError("Invalid email");
        // 1. Check User Existence
        const user = await UserRepo.findUserByEmail(email);
        if (!user) throw new Error("Invalid credentials");
        // 2. Check Password
        const ok = await UserRepo.matchUserPassword(user.uuid, password);
        if (!ok) throw new Error("Invalid credentials");
        // 3. Issue Tokens
        const {accessToken, refreshToken} = await this.issueTokens(user.uuid);
        return {accessToken, refreshToken, user};
    }

    public async insertUser(user: UserCreateModel): Promise<UserModel | null> {
        // 1. Validate Email
        if (!isEmail(user.email)) throw new TypeError("Invalid email");
        // 2. Check if User Exists
        const existingUser = await UserRepo.findUserByEmail(user.email); // Use await here
        if (existingUser) throw new Error("User already exists");
        // 3. Hash Password
        const passwordHash = await hashPassword(user.password);
        // 4. Uuid, iter id (1-99)
        user.uuid = crypto.randomUUID();
        user.v2_iter_id = Math.floor(Math.random() * 99) + 1;
        user.status = UserStatusEnum.INACTIVE;
        // 5. Insert User (UserCreateModel to UserModel)
        await UserRepo.insertUser(user, passwordHash);
        // 6. Assign Default Role
        await UserRepo.attachRoleToUser(user.uuid, UserRoleEnum.USER_GUEST);
        // 7. Return new User
        return await UserRepo.findUserByUuid(user.uuid);
    }

    public async logoutUser(res: Response, refreshToken: string) {
        // verify & revoke
        const payload = await JwtService.verifyRefreshToken(refreshToken);
        JwtService.clearRefreshTokenCookie(res); // route will clear
        await redisClient.del(`${REFRESH_TOKEN_PREFIX}:${payload.jti}`);
    }

    public async hasRolesOr(userId: string, needRoles: UserRoleEnum[]): Promise<boolean> {
        const userRoles: UserRoleEnum[] = await UserRepo.listRolesByUserUuid(userId);
        // returns true if the user has *any* of the roles in needRoles
        return needRoles.some(role => userRoles.includes(role));
    }

    public async hasRolesAnd(userId: string, needRoles: UserRoleEnum[]): Promise<boolean> {
        const userRoles: UserRoleEnum[] = await UserRepo.listRolesByUserUuid(userId);
        // returns true only if the user has *all* of the roles in needRoles
        return needRoles.every(role => userRoles.includes(role));
    }

    /******************** Profile ********************/
    public async getSelfProfile(userId?: string, email?: string):Promise<UserModel & { roles: UserRoleEnum[] }> {
        if (!userId && !email) throw new Error("User ID or email is required");
        let user: UserModel | null;

        if (email) {
            if (!isEmail(email)) throw new TypeError("Invalid email");
            user = await UserRepo.findUserByEmail(email);
            if (!user) throw new Error("User not found");
        } else {
            if (!isUuidV4(userId!)) throw new TypeError("Invalid user ID");
            user = await UserRepo.findUserByUuid(userId!);
            if (!user) throw new Error("User not found");
        }

        const roles = await UserRepo.listRolesByUserUuid(user.uuid);
        return {...user, roles};
    }

    public async getUserByUuid(uuid: string): Promise<UserModel | null> {
        if (!isUuidV4(uuid)) throw new TypeError("Invalid user ID");
        return await UserRepo.findUserByUuid(uuid);
    }

    public async updateSelfPassword(userId: string, oldPwd: string, newPwd: string) {
        const user = await UserRepo.findUserByUuid(userId);
        if (!user) throw new Error("User not found");
        const ok = await UserRepo.matchUserPassword(userId, oldPwd);
        if (!ok) throw new Error("Invalid old password");
        const newHash = await hashPassword(newPwd);
        await UserRepo.updateUserPassword(userId, newHash);
    }

    /******************** Admin only ********************/
    public async listAllUsers(pager: { offset: number, limit: number }, callerRoles: UserRoleEnum[]) {
        if (!callerRoles.includes(UserRoleEnum.ADMIN)) throw new Error("Unauthorized");
        return UserRepo.listUsers(pager.offset, pager.limit);
    }
}

export default new UserServiceImpl();
