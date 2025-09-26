// StackFusionZiyiliuTop/backend/src/routes/analyticsRoutes.ts
import {Router} from "express";
import {randomUUID} from "crypto";
import VisitService from "@src/services/VisitService";
import {ENDPOINTS} from "@src/common/constants/ENDPOINTS";
import {NODE_ENV, NodeEnvs} from "@src/common/constants/ENV";

export const analyticsRouter = Router();

const VISITOR_COOKIE = "visitor_id";

/**
 * POST /api/v1/analytics/track
 */
analyticsRouter.post(ENDPOINTS.analytics.track, async (req, res) => {
    try {
        // Get or create a visitor_id, and set it in a long-lived cookie
        let visitorId = req.cookies[VISITOR_COOKIE];
        if (!visitorId) {
            visitorId = randomUUID();
            res.cookie(VISITOR_COOKIE, visitorId, {
                httpOnly: true,
                secure: NODE_ENV === NodeEnvs.Production,
                sameSite: "strict",
                maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
            });
        }

        // Add visitorId to the body for the service layer
        const body = {...req.body, visitor_id: visitorId};

        const xff = (req.headers["x-forwarded-for"] as string) || "";
        await VisitService.recordEvent(body || {}, xff, req.socket.remoteAddress || "");
        res.status(204).end();
    } catch {
        // swallow to avoid any impact on page performance
        res.status(204).end();
    }
});

/**
 * GET /api/v1/analytics/briefing
 */
analyticsRouter.get(ENDPOINTS.analytics.briefing, async (req, res) => {
    try {
        const data = await VisitService.getBriefing();
        res.json(data || {});
    } catch (e) {
        res.status(500).json({error: "briefing_failed"});
    }
});

export default function mountAnalyticsRoutes(api: Router) {
    api.use(ENDPOINTS.analytics.base, analyticsRouter);
}
