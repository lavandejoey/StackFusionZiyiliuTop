// /StackFusionZiyiliuTop/frontend/src/services/apiService.tsx
import api from "./axios";
import Paths from "@/constants/Paths";
import {type UserModel} from "@/types/User";

/**
 * Payload for the contact form.
 */
export interface ContactFormPayload {
    surname: string;
    first_name: string;
    email: string;
    message: string;
}

/**
 * Sends the contact form data.
 * POST /api/${version}/contact
 * @returns true if the server responded with { success: true }
 */
export async function sendContactForm(
    payload: ContactFormPayload
): Promise<boolean> {
    const response = await api.post<{ success: boolean }>(
        Paths.Contact.Base,
        payload
    );
    return response.data.success;
}

/**
 * Fetches a user by their UUID.
 * GET /api/v1/users/:uuid
 */
export async function getUserByUuid(uuid: string): Promise<UserModel> {
    const response = await api.get<{ data: UserModel }>(`${Paths.Users.Base}/${uuid}`);
    return response.data.data;
}
