import {defineConfig} from "vite"
import react from "@vitejs/plugin-react"
import path from "path"

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
                secure: true,
            }
        }
    },
    build: {
        outDir: 'dist',
        sourcemap: true,
    }
})
