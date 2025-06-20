// /StackFusionZiyiliuTop/backend/vitest.config.ts
import {defineConfig} from "vitest/config";
import path from "path";

const config = defineConfig({
    test: {
        globals: true,
        environment: "node",
        setupFiles: ["config.ts", "./tests/support/setup.ts"],
        isolate: true,
    },
    resolve: {
        alias: {
            "@src": path.resolve(process.cwd(), "./src"),
        },
    },
});

export default config;
