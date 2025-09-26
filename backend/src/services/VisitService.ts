// /StackFusionZiyiliuTop/backend/src/services/VisitService.ts
import VisitRepo, {VisitInsert} from "@src/repos/VisitRepo";
import {Buffer} from 'buffer';

const BOT_UA = [
    /bot/i, /crawler/i, /spider/i,
    /bingpreview/i, /facebookexternalhit/i
];

interface VisitService {
    recordEvent(
        body: Partial<{
            path: string;
            url: string;
            referrer: string;
            ua: string;
            visitor_id: string;
            ts: string | number;
        }>,
        xffHeader?: string,
        remoteIp?: string
    ): Promise<void>;

    getBriefing(): Promise<any>;

    rollupNow(): Promise<void>;     // if you trigger in app (10-min)
    retentionNow(): Promise<void>;  // if you trigger in app (daily)
}

function looksLikeBot(ua?: string) {
    const s = ua || "";
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

class VisitServiceImpl implements VisitService {
    public async recordEvent(
        body: Partial<{
            path: string;
            url: string;
            referrer: string;
            ua: string;
            visitor_id: string;
            ts: string | number;
        }>,
        xffHeader?: string,
        remoteIp?: string
    ): Promise<void> {
        const path = (body.path || "").slice(0, 512);
        const ua = (body.ua || "").slice(0, 512);

        if (!path) return;
        if (looksLikeBot(ua)) return;

        const v: VisitInsert = {
            ts: body.ts ? new Date(body.ts) : new Date(),
            path,
            url: (body.url || "").slice(0, 1024) || null,
            referrer: (body.referrer || "").slice(0, 1024) || null,
            ua,
            visitor_id: (body.visitor_id || "").slice(0, 36) || null,
            ip_mask: maskIp(((xffHeader || "").split(",")[0] || remoteIp || "").trim()),
        };

        await VisitRepo.insertEvent(v);
    }

    public async getBriefing() {
        return VisitRepo.getBriefing();
    }

    public async rollupNow(): Promise<void> {
        await VisitRepo.upsertRollupToday();
    }

    public async retentionNow(): Promise<void> {
        await VisitRepo.pruneOldRaw();
    }
}

export default new VisitServiceImpl();
