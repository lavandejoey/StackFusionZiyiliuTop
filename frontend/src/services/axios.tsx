// /StackFusionZiyiliuTop/frontend/src/services/axios.tsx
import axios, {
    type AxiosInstance,
    type AxiosResponse,
    type AxiosError,
    type InternalAxiosRequestConfig,
    type AxiosRequestHeaders,
} from 'axios';
import {refresh as refreshService} from '@/services/authService';
import Paths from "@/constants/Paths";

// grab the VITE key once
const ACCESS_TOKEN_KEY = import.meta.env.VITE_ACCESS_TOKEN_KEY;

// Build base URL from env
const DOMAIN = import.meta.env.DEV
    ? import.meta.env.VITE_API_DOMAIN_DEV
    : import.meta.env.VITE_API_DOMAIN_PROD;
const VERSION = import.meta.env.VITE_API_VERSION;
const BASE_URL = `${DOMAIN}/api/${VERSION}`;

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
        if (originalReq.url === `${Paths.Auth.Base}${Paths.Auth.Refresh}`) {
            return Promise.reject(err);
        }

        // if we get a 401 and haven’t already tried to refresh...
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
                refreshService()
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

export default api;
