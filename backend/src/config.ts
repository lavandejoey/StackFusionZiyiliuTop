// /StackFusionZiyiliuTop/backend/src/config.ts
// /* eslint-disable n/no-process-env */
import path from "path";
import dotenv from "dotenv";
import moduleAlias from "module-alias";

// Check the env
const NODE_ENV = (process.env.NODE_ENV ?? "development");

// Configure "dotenv"
const result2 = dotenv.config({
    path: path.join(process.cwd(), `/config/.env.${NODE_ENV}`),
});
if (result2.error) {
    throw result2.error;
}

// Configure moduleAlias
if (__filename.endsWith("js")) {
    moduleAlias.addAlias("@src", process.cwd() + "/dist");
    moduleAlias.addAlias("@src", path.join(process.cwd(), "dist"));
}