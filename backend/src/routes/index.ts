// /StackFusionZiyiliuTop/backend/src/routes/index.ts
import {Router} from "express";
import Paths from "@src/common/constants/Paths";
import {authRouter} from "@src/routes/authRoutes";
import {proxyRouter} from "@src/routes/v2rayRoutes";
import {contactRouter} from "@src/routes/contactRoutes";
import {userRouter} from "@src/routes/userRoutes";
// import {blogRouter} from "@src/routes/NotionRoutes";

/******************************************************************************
 Setup
 ******************************************************************************/

const apiRouter = Router();
apiRouter.get("/", (req, res) => {
    res.status(200).json({
        message: "Welcome to the API",
        version: Paths.Base,
    });
});
/******************************************************************************
 Routes
 ******************************************************************************/
/** Mount user routes under `/users` */
apiRouter.use(Paths.Auth.Base, authRouter);
apiRouter.use(Paths.Proxy.Base, proxyRouter);
apiRouter.use(Paths.Contact.Base, contactRouter);
apiRouter.use(Paths.Users.Base, userRouter);


/******************************************************************************
 Export default
 ******************************************************************************/

export default apiRouter;
