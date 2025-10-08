// /StackFusionZiyiliuTop/backend/src/types/users.ts
import {RowDataPacket} from "mysql2/promise";

export enum UserStatusEnum {
    ACTIVE = "active",
    INACTIVE = "inactive",
}

export enum UserRoleEnum {
    ADMIN = 1,
    USER_MANAGER = 2,
    USER_FRIEND = 3,
    USER_GUEST = 4,
}

export interface UserCreateModel {
    uuid?: string;
    email: string;
    first_name: string;
    last_name: string;
    password: string;
    v2_iter_id?: number;
    status?: UserStatusEnum;
}

export interface UserModel {
    uuid: string;
    email: string;
    first_name?: string;
    last_name?: string;
    v2_iter_id: number;
    status: UserStatusEnum;
    created_at: Date;
    updated_at: Date;
    roles?: UserRoleEnum[];
}

export interface RoleModel {
    id: UserRoleEnum;
    role_name: string;
    description: string;
}

export interface UserRoleMappingModel {
    user_uuid: string;
    role_id: UserRoleEnum;
}

export type UserRow = RowDataPacket & UserModel;
export type RoleRow = RowDataPacket & RoleModel;
export type UserRoleMappingRow = RowDataPacket & UserRoleMappingModel;
export type PasswordRow = RowDataPacket & { password_hash: string };

export interface AuthUser {
    uuid: string;
    roles?: UserRoleEnum[];
}
