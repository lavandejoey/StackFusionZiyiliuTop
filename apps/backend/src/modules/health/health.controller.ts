import { Router } from "express";
import HttpStatusCodes from "@src/common/constants/HttpStatusCodes";

export const healthRouter = Router();

healthRouter.get("/", (_req, res) => {
    res.status(HttpStatusCodes.OK).json({
        status: "ok",
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
    });
});
