// /StackFusionZiyiliuTop/frontend/src/services/axios.tsx
import axios, {
    type AxiosError,
    type AxiosInstance,
    type AxiosRequestHeaders,
    type AxiosResponse,
    type InternalAxiosRequestConfig,
} from 'axios';
import {apiRefreshToken} from "@/services/authService";
import type {ContactFormPayload} from "@/services/apiService";

// Prefix for all API calls
const API_PREFIX = `/api/${import.meta.env.VITE_API_VERSION}`;
// grab the VITE key once
const ACCESS_TOKEN_KEY = import.meta.env.VITE_ACCESS_TOKEN_KEY;

// Track logout state to prevent token refresh
let isLoggedOut = false;

// Export utility function to set logged out state
export const setLoggedOut = (value: boolean) => {
    isLoggedOut = value;
};

// Build base URL from env
const DOMAIN = import.meta.env.DEV
    ? import.meta.env.VITE_API_DOMAIN_DEV
    : import.meta.env.VITE_API_DOMAIN_PROD;
const BASE_URL = `${DOMAIN}${API_PREFIX}`;

// Create the axios instance
const api: AxiosInstance = axios.create({
    baseURL: BASE_URL,
    withCredentials: true,
    headers: {'Content-Type': 'application/json'},
});

// ---- REQUEST INTERCEPTOR: attach access token ----
api.interceptors.request.use(
    (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
        const token = sessionStorage.getItem(ACCESS_TOKEN_KEY);
        if (token) {
            // ensure headers object exists and is the right type
            const headers = (config.headers ?? {}) as AxiosRequestHeaders;
            headers.Authorization = `Bearer ${token}`;
            config.headers = headers;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ---- RESPONSE INTERCEPTOR: refresh on 401 ----
let isRefreshing = false;
let queue: Array<(token: string | null) => void> = [];

// Helper to resolve/reject all queued calls
function processQueue(token: string | null = null) {
    queue.forEach((cb) => cb(token));
    queue = [];
}

api.interceptors.response.use(
    (res: AxiosResponse) => res,
    (err: AxiosError) => {
        const originalReq = err.config as InternalAxiosRequestConfig & {
            _retry?: boolean;
        };

        // if we get a 401 on the refresh endpoint, don't try to refresh again
        if (originalReq.url === `/auth/refresh` && err.response?.status === 401) {
            return Promise.reject(err);
        }

        // Skip token refresh if logged out
        if (isLoggedOut) {
            return Promise.reject(err);
        }

        // if we get a 401 and haven't already tried to refresh...
        if (err.response?.status === 401 && !originalReq._retry) {
            originalReq._retry = true;

            if (isRefreshing) {
                console.debug('[axios] 401 received, request queued until refresh completes');
                return new Promise((resolve, reject) => {
                    queue.push((token) => {
                        if (token) {
                            const headers = (originalReq.headers ?? {}) as AxiosRequestHeaders;
                            headers.Authorization = `Bearer ${token}`;
                            originalReq.headers = headers;
                            resolve(api(originalReq));
                        } else {
                            reject(err);
                        }
                    });
                });
            }

            isRefreshing = true;
            console.debug('[axios] 401 received, calling refresh()');

            return new Promise((resolve, reject) => {
                apiRefreshToken()
                    .then((res) => {
                        const newToken = res.accessToken;
                        console.debug('[axios] refresh succeeded, new token:', newToken);

                        // persist the new token
                        sessionStorage.setItem(ACCESS_TOKEN_KEY, newToken);
                        api.defaults.headers.common.Authorization = `Bearer ${newToken}`;

                        processQueue(newToken);
                        const headers = (originalReq.headers ?? {}) as AxiosRequestHeaders;
                        headers.Authorization = `Bearer ${newToken}`;
                        originalReq.headers = headers;
                        resolve(api(originalReq));
                    })
                    .catch((refreshError) => {
                        console.error('[axios] refresh failed:', refreshError);
                        processQueue(null);
                        sessionStorage.removeItem(ACCESS_TOKEN_KEY);
                        reject(refreshError);
                    })
                    .finally(() => {
                        isRefreshing = false;
                    });
            });
        }

        return Promise.reject(err);
    }
);

// Auth endpoints
export const AuthAPI = {
    // POST /api/v1/auth/login
    login: ({email, password}: { email: string; password: string }) =>
        api.post(`/auth/login`, {}, {params: {email, password}}),
    logout: (): Promise<void> =>
        api.post(`/auth/logout`),
    refreshToken: () =>
        api.post(`/auth/refresh`),
    me: () =>
        api.get(`/auth/me`),
    signup: ({email, password, first_name, last_name}: {
        email: string;
        password: string;
        first_name: string;
        last_name: string
    }) =>
        api.post(`/auth/signup`, {}, {params: {email, password, first_name, last_name}}),
    exists: (params: { email?: string; uuid?: string }) =>
        api.get(`/auth/exists`, {params}),
};

// User endpoints
export const UsersAPI = {
    list: () =>
        api.get(`/users`),
    listAll: () =>
        api.get(`/users/all`),
    getByUuid: (uuid: string) =>
        api.get(`/users/${uuid}`),
    getByEmail: (email: string) =>
        api.get(`/users/${email}`),
};

// Contact endpoints
export const ContactsAPI = {
    submit: (data: ContactFormPayload) =>
        api.post(`/contacts/send_mail`, data),
};

// Blog endpoints
export const BlogsAPI = {
    homeList: () =>
        api.get(`/blogs`),
    pages: (id: string)=>
        api.get(`/blogs/pages/${id}`),
    blockChildren: (block_id: string) =>
        api.get(`/blogs/blocks/${block_id}/children`),
    database: (id: string) =>
        api.get(`/blogs/database/${id}`),
    queryDatabase: (id: string, payload: {filter?: object, sorts?: object[]}) =>
        api.post(`/blogs/database/${id}/query`, payload),
};

// Proxy endpoints
export const ProxyAPI = {
    config: (email: string) =>
        api.get(`/proxy/config`, {params: {email}}),
};
