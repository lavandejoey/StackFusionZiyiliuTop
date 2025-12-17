// /StackFusionZiyiliuTop/backend/src/config.ts
/* eslint-disable n/no-process-env */
import path from "path";
import dotenv from "dotenv";
import moduleAlias from "module-alias";

// Check the env
const NODE_ENV = process.env.NODE_ENV ?? "development";

// Configure "dotenv" (prefer backend/config/.env.<NODE_ENV>, fallback to .env)
const envCandidates = [
    path.join(process.cwd(), `/config/.env.${NODE_ENV}`),
    path.join(process.cwd(), ".env"),
];
let loaded = false;
for (const p of envCandidates) {
    const res = dotenv.config({ path: p });
    if (!res.error) {
        loaded = true;
        break;
    }
}
if (!loaded) {
    throw new Error(
        "Failed to load environment file from config/.env.<NODE_ENV> or .env",
    );
}

// Configure moduleAlias
if (__filename.endsWith("js")) {
    moduleAlias.addAlias("@src", process.cwd() + "/dist");
    moduleAlias.addAlias("@src", path.join(process.cwd(), "dist"));
    moduleAlias.addAlias("@config", process.cwd() + "/dist/config");
    moduleAlias.addAlias("@config", path.join(process.cwd(), "dist", "config"));
}
