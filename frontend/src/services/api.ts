// /StackFusionZiyiliuTop/frontend/src/services/api.ts
import axios, {AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError,} from "axios";

declare module "axios" {
    export interface AxiosRequestConfig {
        _retry?: boolean;
    }
}

// Determine API base URL from Vite env
const DEV = import.meta.env.DEV;
const DOMAIN = DEV ? import.meta.env.VITE_API_DOMAIN_DEV : import.meta.env.VITE_API_DOMAIN_PROD;
const VERSION = import.meta.env.VITE_API_VERSION;

// Create Axios instance
export const api: AxiosInstance = axios.create({
    baseURL: `${DOMAIN}/api/${VERSION}`,
    withCredentials: true,
    headers: {"Content-Type": "application/json"},
});

/* 401 refresh interceptor */
api.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error: AxiosError) => {
        const cfg = error.config as AxiosRequestConfig & { _retry?: boolean };
        if (error.response?.status !== 401 || cfg._retry) return Promise.reject(error);

        // never retry login/signup/server endpoints
        if (
            cfg.url?.includes("/jwt/login") ||
            cfg.url?.includes("/jwt/server") ||
            cfg.url?.includes("/user/signup")
        ) {
            return Promise.reject(error);
        }

        // only retry once
        if (cfg._retry) return Promise.reject(error);

        cfg._retry = true;
        try {
            await api.post("/jwt/server");            // refresh server token
            return api(cfg);                          // replay original
        } catch {
            window.location.href = "/auth";           // hard redirect
            return Promise.reject(error);
        }
    }
);

// Auth User / JWT endpoints
export const apiGetServerToken = () => api.post("/jwt/server");
export const apiLogin = (email: string, password: string) => api.post("/jwt/login", {email, password});
export const apiLogout = () => api.post("/jwt/logout");
export const apiFetchSelfUser = () => api.get("/user/me");
export const apiFetchAllUsers = () => api.get("/user/all");
export const apiSignup = (body: {
    firstName: string; lastName: string; email: string; password: string;
}) => api.post("/user/signup", body);
export const apiGetUser = (key: string) => api.get(`/user/${encodeURIComponent(key)}`);
export const apiUpdateUser = (
    uuid: string,
    body: Partial<{ firstName: string; lastName: string; email: string; oldPassword: string; newPassword: string; }>
) => api.patch(`/user/${uuid}`, body);
export const apiEmailExists = (email: string) => api.get("/user/exists", {params: {email}});

// Contact endpoints
export const apiMailingMessage = (body: {
    surname: string, firstName: string, email: string, message: string,
}) => api.post("/contact", body);

// Fetch list of blog home pages
export const apiFetchBlogList = () => api.get("/blog");

// Fetch one blog post (metadata + rendered HTML)
export const apiFetchBlogPost = (pageId: string) =>
    api.get(`/blog/${encodeURIComponent(pageId)}`);

/**
 * Returns a URL that will proxy to our Express media endpoint.
 * @param kind  "cover" | "image"
 * @param id    pageId (for cover) or blockId (for image)
 */
export function getMediaUrl(kind: "cover" | "image", id: string): string {
    // baseURL already points to `${DOMAIN}/api/${VERSION}`
    return `${DOMAIN}/api/${VERSION}/blog/media/${kind}/${encodeURIComponent(id)}`;
}

export default api;
