// /frontend/src/services/analyticsService.tsx
import { AnalyticsAPI, type TrackVisitPayload, type BriefingData, type BriefingMetrics, type VisitRecent, type VisitRollup, type VisitTuple } from "./axios";

/**
 * Sends a "fire-and-forget" tracking event to the backend.
 * @param path The path of the page being visited (e.g., "/about").
 */
export const trackVisit = (path: string): void => {
    const payload: TrackVisitPayload = {
        ts: new Date().toISOString(),
        path: path,
        url: window.location.href,
        referrer: document.referrer || null,
        ua: navigator.userAgent,
    };

    // Fire-and-forget: send the request but don't wait for it or handle errors,
    // to avoid any impact on user experience.
    AnalyticsAPI.track(payload).catch(() => {
        // Swallow errors intentionally
        console.log("Analytics tracking call failed, but we are ignoring it.");
    });
};

/**
 * Fetches a briefing of analytics data from the backend.
 * @return A promise that resolves to the briefing data, or null on failure.
 */
export const fetchAnalyticsBriefing = async (): Promise<BriefingData | null> => {
    try {
        const res = await AnalyticsAPI.briefing({ recent: 50, days: 14 });
        const rawEnvelope = res.data as { data?: Partial<BriefingData> } | Partial<BriefingData>;
        const raw = (rawEnvelope as { data?: Partial<BriefingData> }).data ?? rawEnvelope as Partial<BriefingData>;

        const toTupleArray = (v: unknown): VisitTuple[] => {
            if (!v) return [];
            try {
                const parsed = typeof v === "string" ? JSON.parse(v) : v;
                if (!Array.isArray(parsed)) return [];
                return parsed
                    .filter((x: unknown) => Array.isArray(x) && x.length >= 2)
                    .map((x: unknown) => [String((x as unknown[])[0] ?? ""), Number((x as unknown[])[1] ?? 0)] as VisitTuple);
            } catch {
                return [];
            }
        };

        const metrics: BriefingMetrics = raw?.metrics ?? {
            pv_today: 0,
            uv_today: 0,
            pv_7d: 0,
            uv_7d: 0,
            top_paths_today: [],
            top_ref_today: [],
        };

        metrics.top_paths_today = toTupleArray(metrics.top_paths_today);
        metrics.top_ref_today = toTupleArray(metrics.top_ref_today);

        const recent: VisitRecent[] = Array.isArray(raw?.recent) ? raw.recent : [];
        const rollups: VisitRollup[] = Array.isArray(raw?.rollups) ? raw.rollups.map(r => ({
            ...r,
            top_paths: toTupleArray(r.top_paths),
            top_ref: toTupleArray(r.top_ref),
        })) : [];

        return { metrics, recent, rollups };
    } catch (e) {
        console.error('fetchAnalyticsBriefing failed', e);
        return null;
    }
};
