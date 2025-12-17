// /StackFusionZiyiliuTop/backend/src/services/VisitService.ts
import VisitRepo, { Briefing, DailyRollupRow, VisitEventRow, VisitInsert } from "@src/repos/VisitRepo";
import { Buffer } from "buffer";
import { env } from "@src/common/constants/ENV";
import logger from "jet-logger";

const BOT_UA = [
    /bot/i, /crawler/i, /spider/i,
    /bingpreview/i, /facebookexternalhit/i,
];

interface VisitService {
    recordEvent(
        body: Partial<{
            path: string,
            url: string,
            referrer: string,
            ua: string,
            visitor_id: string,
            ts: string | number,
        }>,
        xffHeader?: string,
        remoteIp?: string
    ): Promise<void>;

    getBriefing(opts?: BriefingOptions): Promise<BriefingResponse | null>;

    rollupNow(): Promise<void>;     // if you trigger in app (10-min)
    retentionNow(): Promise<void>;  // if you trigger in app (daily)
    startBackgroundJobs(): void;
}

export interface BriefingOptions {
    recentLimit?: number;
    rollupDays?: number;
}

export interface VisitSafeEvent {
    ts: string;
    path: string;
    referrer: string | null;
    url: string | null;
    visitor_hint: string;
    ip_mask: string | null;
}

export interface DailyRollup {
    day: string;
    pageviews: number;
    visitors: number;
    top_paths: [string, number][];
    top_ref: [string, number][];
}

export interface BriefingResponse {
    metrics: Briefing;
    recent: VisitSafeEvent[];
    rollups: DailyRollup[];
}

function looksLikeBot(ua?: string) {
    const s = ua ?? "";
    return BOT_UA.some(rx => rx.test(s));
}

function maskIp(ipRaw?: string | null): Buffer | null {
    if (!ipRaw) return null;
    const ip = ipRaw.replace("::ffff:", "");
    const parts = ip.split(".");
    if (parts.length !== 4) return null; // ignore ipv6 for now
    const bytes = parts.map((p, i) => (i === 3 ? 0 : Math.max(0, Math.min(255, Number(p) || 0))));
    return Buffer.from(bytes);
}

function bufferToMask(buf: Buffer | null): string | null {
    if (!buf || buf.length < 4) return null;
    return `${buf[0]}.${buf[1]}.${buf[2]}.0/24`;
}

function parseTupleJson(v: unknown): [string, number][] {
    if (!v) return [];
    try {
        const parsed: unknown = typeof v === "string" ? JSON.parse(v) : v;
        if (!Array.isArray(parsed)) return [];
        return parsed
            .filter((x: unknown): x is unknown[] => Array.isArray(x) && x.length >= 2)
            .map((x: unknown[]) => {
                const rawKey = x[0];
                const rawVal = x[1];
                let keyStr: string;
                if (typeof rawKey === "string") keyStr = rawKey;
                else if (rawKey === null || rawKey === undefined) keyStr = "";
                else if (typeof rawKey === "number" || typeof rawKey === "boolean") keyStr = String(rawKey);
                else keyStr = JSON.stringify(rawKey);

                const num = typeof rawVal === "number" ? rawVal : Number(rawVal ?? 0);
                return [keyStr, Number.isFinite(num) ? num : 0] as [string, number];
            });
    } catch {
        return [];
    }
}

class VisitServiceImpl implements VisitService {
    private jobsStarted = false;
    private rollupRunning = false;
    private retentionRunning = false;

    public async recordEvent(
        body: Partial<{
            path: string,
            url: string,
            referrer: string,
            ua: string,
            visitor_id: string,
            ts: string | number,
        }>,
        xffHeader?: string,
        remoteIp?: string,
    ): Promise<void> {
        const path = (body.path ?? "").slice(0, 512);
        const ua = (body.ua ?? "").slice(0, 512);

        if (!path) return;
        if (looksLikeBot(ua)) return;

        const ipRaw = (((xffHeader ?? "").split(",")[0]) ?? remoteIp ?? "").trim();

        const v: VisitInsert = {
            ts: body.ts ? new Date(body.ts) : new Date(),
            path,
            url: (body.url ?? "").slice(0, 1024) || null,
            referrer: (body.referrer ?? "").slice(0, 1024) || null,
            ua,
            visitor_id: (body.visitor_id ?? "").slice(0, 36) || null,
            ip_mask: maskIp(ipRaw),
        };

        await VisitRepo.insertEvent(v);
    }

    public async getBriefing(opts?: BriefingOptions): Promise<BriefingResponse | null> {
        const [metrics, recentRows, rollupRows] = await Promise.all([
            VisitRepo.getBriefing(),
            VisitRepo.listRecentEvents(opts?.recentLimit ?? 50),
            VisitRepo.listRollups(opts?.rollupDays ?? 14),
        ]);

        if (!metrics) return null;

        const recent: VisitSafeEvent[] = (recentRows ?? []).map((r: VisitEventRow) => ({
            ts: new Date(r.ts).toISOString(),
            path: r.path,
            referrer: r.referrer ?? null,
            url: r.url ?? null,
            visitor_hint: r.visitor_id ? `${r.visitor_id.slice(0, 6)}…` : "anon",
            ip_mask: bufferToMask(r.ip_mask),
        }));

        const rollups: DailyRollup[] = (rollupRows ?? []).map((r: DailyRollupRow) => {
            const rawPageviews = r.pageviews ?? 0;
            const rawVisitors = r.visitors ?? 0;
            const pageviews = typeof rawPageviews === "number" ? rawPageviews : Number(rawPageviews);
            const visitors = typeof rawVisitors === "number" ? rawVisitors : Number(rawVisitors);
            return {
                day: new Date(r.day as string).toISOString().slice(0, 10),
                pageviews: Number.isFinite(pageviews) ? pageviews : 0,
                visitors: Number.isFinite(visitors) ? visitors : 0,
                top_paths: parseTupleJson(r.top_paths),
                top_ref: parseTupleJson(r.top_ref),
            };
        });

        return { metrics, recent, rollups };
    }

    public async rollupNow(): Promise<void> {
        if (this.rollupRunning) return;
        this.rollupRunning = true;
        try {
            await VisitRepo.upsertRollupToday();
        } finally {
            this.rollupRunning = false;
        }
    }

    public async retentionNow(): Promise<void> {
        if (this.retentionRunning) return;
        this.retentionRunning = true;
        try {
            await VisitRepo.pruneOldRaw(env.VISIT_RETENTION_DAYS);
        } finally {
            this.retentionRunning = false;
        }
    }

    public startBackgroundJobs(): void {
        if (this.jobsStarted || !env.ENABLE_VISIT_JOBS) return;
        this.jobsStarted = true;

        const rollupEveryMs = Math.max(5, env.VISIT_ROLLUP_INTERVAL_MINUTES) * 60 * 1000;
        const runRollup = async () => {
            try {
                await this.rollupNow();
            } catch (err) {
                logger.err(`visit rollup failed: ${err instanceof Error ? err.message : String(err)}`);
            }
        };
        runRollup();
        setInterval(runRollup, rollupEveryMs);

        const dailyMs = 24 * 60 * 60 * 1000;
        const runRetention = async () => {
            try {
                await this.retentionNow();
            } catch (err) {
                logger.err(`visit retention failed: ${err instanceof Error ? err.message : String(err)}`);
            }
        };
        runRetention();
        setInterval(runRetention, dailyMs);

        logger.info("Visit background jobs started");
    }
}

export default new VisitServiceImpl();
