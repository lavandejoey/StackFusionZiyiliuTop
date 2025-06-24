// /StackFusionZiyiliuTop/backend/src/routes/index.ts
import {Router} from "express";
import {ENDPOINTS} from "@src/common/constants/ENDPOINTS";
import {authRouter} from "@src/routes/authRoutes";
import {proxyRouter} from "@src/routes/v2rayRoutes";
import {contactRouter} from "@src/routes/contactRoutes";
import {userRouter} from "@src/routes/userRoutes";
import {blogRouter} from "@src/routes/blogRoutes";
import HttpStatusCodes from "@src/common/constants/HttpStatusCodes";
import {API_VERSION} from "@src/common/constants/ENV";

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

/******************************************************************************
 Export default
 ******************************************************************************/

export default apiRouter;
