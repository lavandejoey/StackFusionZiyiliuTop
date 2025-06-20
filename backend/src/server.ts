// /StackFusionZiyiliuTop/backend/src/server.ts
import morgan from "morgan";
import helmet from "helmet";
import express, {NextFunction, Request, Response} from "express";
import logger from "jet-logger";
import cors from "cors";

import BaseRouter from "@src/routes";

import Paths from "@src/common/constants/Paths";
import {FRONTEND_DOMAIN_DEV, FRONTEND_DOMAIN_PROD, NODE_ENV} from "@src/common/constants/ENV";
import HttpStatusCodes from "@src/common/constants/HttpStatusCodes";
import {RouteError} from "@src/common/util/route-errors";
import {NodeEnvs} from "@src/common/constants/ENV";
import {attachReqId, errorResponse} from "@src/common/util/response";
import cookieParser from "cookie-parser";


/******************************************************************************
 Setup
 ******************************************************************************/
const app = express();


// **** Middleware **** //
// Basic middleware
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({extended: true}));
app.use(attachReqId);
if (NODE_ENV === NodeEnvs.Production) app.set("trust proxy", 1); // trust first proxy
// Enable CORS for exactly your frontend origin, with credentials:
app.use(cors({
    origin: NODE_ENV === NodeEnvs.Dev
        ? FRONTEND_DOMAIN_DEV
        : FRONTEND_DOMAIN_PROD,
    credentials: true,
}));

// Show routes called in console during development
if (NODE_ENV === NodeEnvs.Dev) {
    app.use(morgan("dev"));
}
// Security
if (NODE_ENV === NodeEnvs.Production) {
    app.use(helmet());
}

// Add APIs, must be after middleware
app.use(Paths.Base, BaseRouter);

// Add error handler
app.use((err: Error, _: Request, res: Response, next: NextFunction) => {
    if (NODE_ENV !== NodeEnvs.Test.valueOf()) {
        logger.err(err, true);
    }
    let status = HttpStatusCodes.BAD_REQUEST;
    if (err instanceof RouteError) {
        status = err.status;
        res.status(status).json({error: err.message});
    }
    return next(err);
});

// Nav to users pg by default
app.get(["/", "/api"], (_: Request, res: Response) => res.redirect(Paths.Base));
// Catch-all for 404s
app.use((req: Request, res: Response) => {
    res.status(HttpStatusCodes.NOT_FOUND).send(errorResponse(
        req, res, "Not Found", "Route does not exist",
    ));
});


/******************************************************************************
 Export default
 ******************************************************************************/

export default app;
