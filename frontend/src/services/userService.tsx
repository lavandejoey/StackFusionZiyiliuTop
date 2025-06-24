// /StackFusionZiyiliuTop/frontend/src/services/userService.tsx
import type {UserModel} from "@/types/User.ts";
import {UsersAPI} from "@/services/axios";

/** Fetches a user by their UUID.*/
export async function getUserByUuid(uuid: string): Promise<UserModel> {
    const response = await UsersAPI.getByUuid(uuid);
    const {user} = response.data.data;
    return user;
}
