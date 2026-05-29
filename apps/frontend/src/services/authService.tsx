// /StackFusionZiyiliuTop/frontend/src/services/authService.tsx
import {type UserModel} from "@/types/User";
import {AuthAPI} from "@/services/axios";

/** Payload for signing up a new user */
export interface SignupPayload {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
}

/** Response shape when logging in */
interface LoginResponse {
    accessToken: string;
    user: UserModel;
}

/** Response shape when refreshing token */
interface RefreshResponse {
    accessToken: string;
}

/** Log in with email & password; stores token & returns profile */
export async function apiLogin(email: string, password: string): Promise<LoginResponse> {
    const response = await AuthAPI.login({email, password});
    const {accessToken, user} = response.data.data;
    sessionStorage.setItem(import.meta.env.VITE_ACCESS_TOKEN_KEY, accessToken);
    return {accessToken, user};
}

/** Log out (clears server‐side cookie + client token) */
export async function apiLogout(): Promise<void> {
    try {
        await AuthAPI.logout();
    } catch (error) {
        console.error("API logout request failed:", error);
        throw error;
    }
}

/** Refresh the access token via the HTTP‐only cookie */
export async function apiRefreshToken(): Promise<RefreshResponse> {
    const response = await AuthAPI.refreshToken();
    const {accessToken} = response.data.data;
    sessionStorage.setItem(import.meta.env.VITE_ACCESS_TOKEN_KEY, accessToken);
    return {accessToken};
}

/** Fetch the current user's profile */
export async function apiGetMe(): Promise<UserModel> {
    const response = await AuthAPI.me();
    return response.data.data;
}

/** Sign up & immediately log in; stores token & returns profile */
export async function apiSignup(payload: SignupPayload): Promise<LoginResponse> {
    const response = await AuthAPI.signup(payload);
    const {accessToken, user} = response.data.data;
    sessionStorage.setItem(import.meta.env.VITE_ACCESS_TOKEN_KEY, accessToken);
    return {accessToken, user};
}

/** Check if an e-mail is already registered */
export async function apiEmailExists(email: string): Promise<boolean> {
    const response = await AuthAPI.exists({email});
    const {exists} = response.data.data;
    return exists;
}

/** Check if a user with the given UUID exists */
export async function apiUserExists(uuid: string): Promise<boolean> {
    const response = await AuthAPI.exists({uuid});
    const {exists} = response.data.data;
    return exists;
}
