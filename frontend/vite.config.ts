// /StackFusionZiyiliuTop/frontend/vite.config.ts
import {defineConfig} from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src")
        }
    },
    server: {
        port: 35835,
        // Express Backend Server
        proxy: {
            "/api": {
                target: "http://localhost:2069",
                changeOrigin: true,
                secure: false, // true for https, false for http
            }
        }
    },
    preview: {
        port: 35835,
        // Express Backend Server
        proxy: {
            "/api": {
                target: "https://ziyiliu.top",
                changeOrigin: true,
                secure: false, // true for https, false for http
            }
        },
        allowedHosts: [
            "localhost",
            "ziyiliu.top",
            "www.ziyiliu.top"
        ],
    },
    build: {
        outDir: "dist",
        sourcemap: true
    }
});
