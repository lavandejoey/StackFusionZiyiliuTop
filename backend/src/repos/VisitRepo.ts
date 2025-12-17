// /StackFusionZiyiliuTop/backend/src/repos/VisitRepo.ts
import { FieldPacket } from "mysql2/promise";
import { default as dbClient } from "@src/common/util/mysql2Config";
import { Buffer } from "buffer";
import { getSql } from "@src/common/util/sqlLoader";

export interface VisitInsert {
    ts: Date;
    path: string;
    url?: string | null;
    referrer?: string | null;
    ua?: string | null;
    visitor_id?: string | null;
    ip_mask?: Buffer | null;
}

interface VisitRepo {
    insertEvent(v: VisitInsert): Promise<void>;

    getBriefing(): Promise<Briefing | null>;

    listRecentEvents(limit: number): Promise<VisitEventRow[]>;

    listRollups(days: number): Promise<DailyRollupRow[]>;

    upsertRollupToday(): Promise<void>;  // if you run rollups in-app
    pruneOldRaw(retentionDays?: number): Promise<void>;        // retention (configurable)
}

export interface Briefing {
    pv_today: number;
    uv_today: number;
    pv_7d: number;
    uv_7d: number;
    top_paths_today: [string, number][];
    top_ref_today: [string, number][];
}

export interface VisitEventRow {
    ts: Date;
    path: string;
    url: string | null;
    referrer: string | null;
    ua: string | null;
    visitor_id: string | null;
    ip_mask: Buffer | null;
}

export interface DailyRollupRow {
    day: Date | string;
    pageviews: number;
    visitors: number;
    top_paths: string;
    top_ref: string;
}

class VisitRepoImpl implements VisitRepo {
    public async insertEvent(v: VisitInsert): Promise<void> {
        const dayUtc = new Date(Date.UTC(
            v.ts.getUTCFullYear(),
            v.ts.getUTCMonth(),
            v.ts.getUTCDate(),
        ));

        await dbClient.execute(getSql("INSERT_EVENT"), [
            v.ts,
            dayUtc,
            v.path,
            v.url ?? null,
            v.referrer ?? null,
            v.ua ?? null,
            v.visitor_id ?? null,
            v.ip_mask ?? null,
        ]);
    }

    public async getBriefing(): Promise<Briefing | null> {
        const [rows] = await dbClient.query(getSql("BRIEFING")) as [Record<string, unknown>[], FieldPacket[]];
        const row = rows[0];
        if (!row) return null;

        const toNumber = (v: unknown) => (v === null || v === undefined) ? 0 : Number(v);
        const toTupleArray = (v: unknown): [string, number][] => {
            if (!v) return [];
            try {
                const parsed: unknown = typeof v === "string" ? (JSON.parse(v) as unknown) : v;
                if (!Array.isArray(parsed)) return [];
                return (parsed as unknown[])
                    .filter((x: unknown) => Array.isArray(x) && (x as unknown[]).length >= 2)
                    .map((x: unknown) => {
                        const arr = x as unknown[];
                        const first = arr[0];
                        const second = arr[1];
                        const k = typeof first === "string" ? first : "";
                        const n = typeof second === "number" ? second : Number(second ?? 0);
                        return [k, n] as [string, number];
                    });
            } catch {
                return [];
            }
        };

        return {
            pv_today: toNumber(row.pv_today),
            uv_today: toNumber(row.uv_today),
            pv_7d: toNumber(row.pv_7d),
            uv_7d: toNumber(row.uv_7d),
            top_paths_today: toTupleArray(row.top_paths_today),
            top_ref_today: toTupleArray(row.top_ref_today),
        };
    }

    public async listRecentEvents(limit: number): Promise<VisitEventRow[]> {
        const safeLimit = Math.min(Math.max(1, limit), 200);
        const [rows] = await dbClient.query(getSql("RECENT_EVENTS"), [safeLimit]) as [VisitEventRow[], FieldPacket[]];
        return rows;
    }

    public async listRollups(days: number): Promise<DailyRollupRow[]> {
        const safeDays = Math.min(Math.max(1, days), 90);
        const [rows] = await dbClient.query(
            getSql("ROLLUP_LAST_DAYS"),
            [safeDays],
        ) as [DailyRollupRow[], FieldPacket[]];
        return rows;
    }

    public async upsertRollupToday(): Promise<void> {
        await dbClient.query(getSql("ROLLUP_UPSERT"));
    }

    public async pruneOldRaw(retentionDays = 30): Promise<void> {
        await dbClient.query(getSql("RETENTION_RAW"), [retentionDays]);
    }
}

export default new VisitRepoImpl();
