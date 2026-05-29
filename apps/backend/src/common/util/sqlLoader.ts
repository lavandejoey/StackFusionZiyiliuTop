import fs from "fs";
import path from "path";
import logger from "jet-logger";

type SqlMap = Record<string, string>;

const SQL_DIR = path.resolve(process.cwd(), "config/sql");
const SQL_FILE = path.join(SQL_DIR, "analytics.sql");
let cache: SqlMap | null = null;

function parseSqlFile(content: string): SqlMap {
    const lines = content.split(/\r?\n/);
    const map: SqlMap = {};
    let current: string | null = null;
    let bucket: string[] = [];

    const flush = () => {
        if (current) {
            const sql = bucket.join("\n").trim();
            if (sql) map[current] = sql;
        }
        bucket = [];
    };

    for (const line of lines) {
        const nameMatch = /^--\s*name:\s*([A-Za-z0-9_]+)/.exec(line);
        if (nameMatch) {
            flush();
            current = nameMatch[1];
            continue;
        }
        if (current) bucket.push(line);
    }
    flush();
    return map;
}

function loadSqlMap(): SqlMap {
    try {
        const content = fs.readFileSync(SQL_FILE, { encoding: "utf-8" });
        return parseSqlFile(content);
    } catch (err) {
        const reason = err instanceof Error ? err.message : String(err);
        logger.err(
            `Unable to load SQL template file at ${SQL_FILE}: ${reason}`,
        );
        return {};
    }
}

export function getSql(name: string): string {
    cache ??= loadSqlMap();
    const sql = cache[name];
    if (!sql) {
        throw new Error(`SQL template '${name}' not found. Ensure config/sql/analytics.sql exists.`);
    }
    return sql;
}

export function clearSqlCache(): void {
    cache = null;
}
