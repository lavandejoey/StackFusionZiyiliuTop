// src/routes/repoRoutes.ts
import {Router} from "express";
import {getProcessedRepos} from "@src/modules/repos/github.client";
import {errorResponse, successResponse} from "@src/common/util/response";
import HttpStatusCodes from "@src/common/constants/HttpStatusCodes";
import logger from "jet-logger";

const repoRouter = Router();

repoRouter.get("/", async (req, res) => {
    try {
        const repos = await getProcessedRepos();
        // logger.info(`Fetched ${repos.length} repositories from GitHub.`);
        res.status(HttpStatusCodes.OK).json(successResponse(req, res, repos));
    } catch (error) {
        logger.err(`Failed to fetch repository data: ${error}`);
        res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json(
            errorResponse(req, res, "Failed to fetch repository data", error),
        );
    }
});

export {repoRouter};
