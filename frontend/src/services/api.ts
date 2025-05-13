// /StackFusionZiyiliuTop/frontend/src/services/api.ts
import axios from "axios";

const api = axios.create({
    baseURL: "/api",
    timeout: 5000,
    withCredentials: true, // if you need cookies for auth
});

export default api;