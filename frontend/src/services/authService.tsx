// /StackFusionZiyiliuTop/frontend/src/services/authService.tsx
import api from "./axios";
import Paths from "@/constants/Paths";
import {type UserModel} from "@/types/User";

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
export async function login(
    email: string,
    password: string
): Promise<LoginResponse> {
    const response = await api.post<{ data: LoginResponse }>(
        `${Paths.Auth.Base}${Paths.Auth.Login}`,
        {},
        {params: {email, password}}
    );
    const {accessToken, user} = response.data.data;
    sessionStorage.setItem(import.meta.env.VITE_ACCESS_TOKEN_KEY, accessToken);
    return {accessToken, user};
}

/** Log out (clears server‐side cookie + client token) */
export async function logout(): Promise<void> {
    await api.post(`${Paths.Auth.Base}${Paths.Auth.Logout}`);
    sessionStorage.removeItem(import.meta.env.VITE_ACCESS_TOKEN_KEY);
}

/** Refresh the access token via the HTTP‐only cookie */
export async function refresh(): Promise<RefreshResponse> {
    const response = await api.post<{ data: RefreshResponse }>(
        `${Paths.Auth.Base}${Paths.Auth.Refresh}`
    );
    const {accessToken} = response.data.data;
    sessionStorage.setItem(import.meta.env.VITE_ACCESS_TOKEN_KEY, accessToken);
    return {accessToken};
}

/** Fetch the current user’s profile */
export async function getMe(): Promise<UserModel> {
    const response = await api.get<{ data: UserModel }>(
        `${Paths.Auth.Base}${Paths.Auth.Me}`
    );
    return response.data.data;
}

/** Sign up & immediately log in; stores token & returns profile */
export async function signup(
    payload: SignupPayload
): Promise<LoginResponse> {
    const response = await api.post<{ data: LoginResponse }>(
        `${Paths.Auth.Base}${Paths.Auth.Signup}`,
        {}, // no body
        {params: payload}
    );
    const {accessToken, user} = response.data.data;
    sessionStorage.setItem(import.meta.env.VITE_ACCESS_TOKEN_KEY, accessToken);
    return {accessToken, user};
}

/** Check if an e-mail is already registered */
async function emailExists(email: string): Promise<boolean> {
    const response = await api.get<{ data: { exists: boolean } }>(
        `${Paths.Auth.Base}${Paths.Auth.Exists}`,
        {params: {email}}
    );
    return response.data.data.exists;
}

export {emailExists as apiEmailExists};
