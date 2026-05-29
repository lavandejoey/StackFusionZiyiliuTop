// /StackFusionZiyiliuTop/apps/backend/src/routes/index.ts
import { Router } from "express";
import { ENDPOINTS } from "@src/common/constants/ENDPOINTS";
import { authRouter } from "@src/modules/auth/auth.routes";
import { proxyRouter } from "@src/modules/proxy/proxy.routes";
import { contactRouter } from "@src/modules/contacts/contacts.routes";
import { userRouter } from "@src/modules/users/users.routes";
import { blogRouter } from "@src/modules/blog/blog.routes";
import HttpStatusCodes from "@src/common/constants/HttpStatusCodes";
import { API_VERSION } from "@src/common/constants/ENV";
import { repoRouter } from "@src/modules/repos/repos.routes";
import { analyticsRouter } from "@src/modules/analytics/analytics.routes";
import { publicationRouter } from "@src/modules/publications/publications.routes";
import { healthRouter } from "@src/modules/health/health.routes";

/******************************************************************************
 Setup
 ******************************************************************************/

const apiRouter = Router();
apiRouter.get("/", (req, res) => {
    res.status(HttpStatusCodes.OK).send({
        message: "Welcome to the API",
        version: API_VERSION,
    });
});
/******************************************************************************
 Routes
 ******************************************************************************/
/** Mount routes using the new path structure */
apiRouter.use(ENDPOINTS.auth.base, authRouter);
apiRouter.use(ENDPOINTS.users.base, userRouter);
apiRouter.use(ENDPOINTS.proxy.base, proxyRouter);
apiRouter.use(ENDPOINTS.contacts.base, contactRouter);
apiRouter.use(ENDPOINTS.blogs.base, blogRouter);
apiRouter.use(ENDPOINTS.repos.base, repoRouter);
apiRouter.use(ENDPOINTS.publications.base, publicationRouter);
apiRouter.use(ENDPOINTS.analytics.base, analyticsRouter);
apiRouter.use(ENDPOINTS.health.base, healthRouter);

/******************************************************************************
 Export default
 ******************************************************************************/

export default apiRouter;
