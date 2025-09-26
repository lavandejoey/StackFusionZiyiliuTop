// /frontend/src/services/analyticsService.tsx
import {AnalyticsAPI, type TrackVisitPayload, type BriefingData} from "./axios";

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
        const res = await AnalyticsAPI.briefing();
        // axios returns the payload under `data`.
        return (res as any).data as BriefingData;
    } catch (e) {
        console.error('fetchAnalyticsBriefing failed', e);
        return null;
    }
};
