// /StackFusionZiyiliuTop/frontend/src/services/apiService.tsx
import {ContactsAPI, ReposAPI} from "@/services/axios";

/**
 * Payload for the contact form.
 */
export interface ContactFormPayload {
    surname: string;
    first_name: string;
    email: string;
    message: string;
}

/** Sends the contact form data. */
export async function sendContactForm(
    payload: ContactFormPayload
): Promise<boolean> {
    const response = await ContactsAPI.submit(payload);
    return response.data.data.success === true;
}

/** Fetches the repository data from the backend. */
export async function fetchRepos() {
    const response = await ReposAPI.fetch();
    return response.data.data;
}
