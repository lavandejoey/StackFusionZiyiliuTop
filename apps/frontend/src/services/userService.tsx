// /StackFusionZiyiliuTop/frontend/src/services/userService.tsx
import type {UserModel} from "@/types/User.ts";
import {UsersAPI} from "@/services/axios";
import type {UserRole} from "@/types/User";

/** Fetches a user by their UUID.*/
export async function getUserByUuid(uuid: string): Promise<UserModel> {
    const response = await UsersAPI.getByUuid(uuid);
    return response.data.data;
}

/** Fetch list of role IDs assigned to a user */
export async function getUserRoles(uuid: string): Promise<UserRole[]> {
    const response = await UsersAPI.getRoles(uuid);
    // backend returns an array of numeric role ids
    return response.data.data as UserRole[];
}

/** List all users with roles paginated */
export async function listAllUsers(page = 1, pageSize = 15): Promise<UserModel[]> {
    // normalize inputs
    const p = Math.max(1, Math.floor(Number(page) || 1));
    const sz = Math.max(1, Math.floor(Number(pageSize) || 15));
    const offset = (p - 1) * sz;
    const response = await UsersAPI.listAll({offset, limit: sz});
    return response.data.data;
}