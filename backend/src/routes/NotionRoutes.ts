import {Router, Request, Response} from "express";
import logger from "jet-logger";
import {errorResponse, successResponse} from "@src/common/util/response";
import Paths from "@src/common/constants/Paths";
import {rootBlogList} from "@src/services/NotionService";

export const blogRouter = Router();

/** List all blog pages
 *  GET /blog/all
 */
blogRouter.get(Paths.Blog.GetAll, async (req: Request, res: Response) => {
    // rootBlogList
    try {
        const blogList: unknown = await rootBlogList();
        res.status(200).json(successResponse(req, res, blogList, "Blog pages retrieved successfully"));
    } catch (error) {
        logger.err(`Failed to retrieve blog pages: ${error instanceof Error ? error.message : error}`);
        res.status(500).json(errorResponse(req, res, "Failed to retrieve blog pages"));
    }
});