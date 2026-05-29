import { Router } from "express";
import { getPublications } from "@src/modules/publications/publications.service";
import { errorResponse, successResponse } from "@src/common/util/response";
import HttpStatusCodes from "@src/common/constants/HttpStatusCodes";
import logger from "jet-logger";

const publicationRouter = Router();

publicationRouter.get("/", (req, res) => {
    try {
        const publications = getPublications();
        res.status(HttpStatusCodes.OK).json(
            successResponse(req, res, publications),
        );
    } catch (error) {
        logger.err(`Failed to fetch publications: ${error}`);
        res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json(
            errorResponse(
                req,
                res,
                "Failed to fetch publications",
                error,
            ),
        );
    }
});

export { publicationRouter };
