// /StackFusionZiyiliuTop/backend/src/repos/VisitRepo.ts
import { FieldPacket } from "mysql2/promise";
import { default as dbClient } from "@src/common/util/mysql2Config";
import { Buffer } from "buffer";

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

    getBriefing(): Promise<{
        pv_today: number, uv_today: number,
        pv_7d: number, uv_7d: number,
        top_paths_today: string, // JSON string: [["/path",123],...]
        top_ref_today: string,   // JSON string: [["direct",100],...]
    } | null>;

    upsertRollupToday(): Promise<void>;  // if you run rollups in-app
    pruneOldRaw(): Promise<void>;        // retention (30 days)
}

export interface Briefing {
    pv_today: number;
    uv_today: number;
    pv_7d: number;
    uv_7d: number;
    top_paths_today: string;
    top_ref_today: string;
}

const INSERT_SQL = `
    INSERT INTO visit_event
        (ts, path, url, referrer, ua, visitor_id, ip_mask)
    VALUES (?, ?, ?, ?, ?, ?, ?)
`;

const BRIEF_SQL = `
    SELECT
        /* today */
            (SELECT COUNT(*) FROM visit_event WHERE day = DATE(UTC_TIMESTAMP()))                         AS pv_today,
            (SELECT COUNT(DISTINCT visitor_id) FROM visit_event WHERE day = DATE(UTC_TIMESTAMP()))       AS uv_today,
        /* last 7d */
            (SELECT COUNT(*) FROM visit_event WHERE ts >= UTC_DATE() - INTERVAL 7 DAY)                   AS pv_7d,
            (SELECT COUNT(DISTINCT visitor_id) FROM visit_event WHERE ts >= UTC_DATE() - INTERVAL 7 DAY) AS uv_7d,
        /* top pages today → JSON string [["/a",123],...] */
            COALESCE((SELECT CONCAT(
                                     '[',
                                     GROUP_CONCAT(CONCAT('[', JSON_QUOTE(path), ',', cnt, ']')
                                                  ORDER BY cnt DESC SEPARATOR ','),
                                     ']'
                             )
                      FROM (SELECT path, COUNT(*) AS cnt
                            FROM visit_event
                            WHERE day = DATE(UTC_TIMESTAMP())
                            GROUP BY path
                            ORDER BY cnt DESC
                            LIMIT 10) x),
                     '[]')                                                                               AS top_paths_today,
        /* top referrers today → JSON string [["direct",100],...] */
            COALESCE((SELECT CONCAT(
                                     '[',
                                     GROUP_CONCAT(CONCAT('[', JSON_QUOTE(ref), ',', cnt, ']')
                                                  ORDER BY cnt DESC SEPARATOR ','),
                                     ']'
                             )
                      FROM (SELECT COALESCE(NULLIF(referrer, ''), 'direct') AS ref, COUNT(*) AS cnt
                            FROM visit_event
                            WHERE day = DATE(UTC_TIMESTAMP())
                            GROUP BY ref
                            ORDER BY cnt DESC
                            LIMIT 10) y),
                     '[]')                                                                               AS top_ref_today
`;

const ROLLUP_UPSERT_SQL = `
    INSERT INTO visit_daily (day, pageviews, visitors, top_paths, top_ref)
    SELECT DATE(UTC_TIMESTAMP())                                                                  AS day,
           (SELECT COUNT(*) FROM visit_event WHERE day = DATE(UTC_TIMESTAMP()))                   AS pageviews,
           (SELECT COUNT(DISTINCT visitor_id) FROM visit_event WHERE day = DATE(UTC_TIMESTAMP())) AS visitors,
        /* top paths */
           COALESCE((SELECT CONCAT(
                                    '[',
                                    GROUP_CONCAT(CONCAT('[', JSON_QUOTE(path), ',', cnt, ']')
                                                 ORDER BY cnt DESC SEPARATOR ','),
                                    ']'
                            )
                     FROM (SELECT path, COUNT(*) AS cnt
                           FROM visit_event
                           WHERE day = DATE(UTC_TIMESTAMP())
                           GROUP BY path
                           ORDER BY cnt DESC
                           LIMIT 10) x), '[]')                                                    AS top_paths,
        /* top ref */
           COALESCE((SELECT CONCAT(
                                    '[',
                                    GROUP_CONCAT(CONCAT('[', JSON_QUOTE(ref), ',', cnt, ']')
                                                 ORDER BY cnt DESC SEPARATOR ','),
                                    ']'
                            )
                     FROM (SELECT COALESCE(NULLIF(referrer, ''), 'direct') AS ref, COUNT(*) AS cnt
                           FROM visit_event
                           WHERE day = DATE(UTC_TIMESTAMP())
                           GROUP BY ref
                           ORDER BY cnt DESC
                           LIMIT 10) y), '[]')                                                    AS top_ref
    ON DUPLICATE KEY UPDATE pageviews = VALUES(pageviews),
                            visitors  = VALUES(visitors),
                            top_paths = VALUES(top_paths),
                            top_ref   = VALUES(top_ref)
`;

const RETENTION_SQL = `
    DELETE
    FROM visit_event
    WHERE ts < (UTC_TIMESTAMP() - INTERVAL 30 DAY)
`;

class VisitRepoImpl implements VisitRepo {
    public async insertEvent(v: VisitInsert): Promise<void> {
        await dbClient.execute(INSERT_SQL, [
            v.ts,
            v.path,
            v.url ?? null,
            v.referrer ?? null,
            v.ua ?? null,
            v.visitor_id ?? null,
            v.ip_mask ?? null,
        ]);
    }

    public async getBriefing(): Promise<{
        pv_today: number, uv_today: number,
        pv_7d: number, uv_7d: number,
        top_paths_today: string,
        top_ref_today: string,
    } | null> {
        const [rows] = await dbClient.query(BRIEF_SQL) as [Record<string, unknown>[], FieldPacket[]];
        const row = rows[0];
        if (!row) return null;

        const toNumber = (v: unknown) => (v === null || v === undefined) ? 0 : Number(v);

        const stringifySafe = (v: unknown) =>
            typeof v === "string" ? v : JSON.stringify(v ?? []);

        return {
            pv_today: toNumber(row.pv_today),
            uv_today: toNumber(row.uv_today),
            pv_7d: toNumber(row.pv_7d),
            uv_7d: toNumber(row.uv_7d),
            top_paths_today: stringifySafe(row.top_paths_today),
            top_ref_today: stringifySafe(row.top_ref_today),
        };
    }

    public async upsertRollupToday(): Promise<void> {
        await dbClient.query(ROLLUP_UPSERT_SQL);
    }

    public async pruneOldRaw(): Promise<void> {
        await dbClient.query(RETENTION_SQL);
    }
}

export default new VisitRepoImpl();
