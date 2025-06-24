// src/routes/blogRoutes.ts
import {Router} from "express";
import {PageObjectResponse} from "@notionhq/client";
import NotionService from "@src/services/NotionService";
import {NOTION_ROOT_BLOG_LIST} from "@src/common/constants/ENV";
import {errorResponse, successResponse} from "@src/common/util/response";
import HttpStatusCodes from "@src/common/constants/HttpStatusCodes";
import logger from "jet-logger";
import {ENDPOINTS} from "@src/common/constants/ENDPOINTS";

const notionRootBlogList: string[] = NOTION_ROOT_BLOG_LIST.split(",").map(id => id.trim());

export const blogRouter = Router();

/** Retrieve all root blog posts
 *  GET /api/${API_VERSION}/blogs
 */
blogRouter.get(ENDPOINTS.blogs.homeList, async (req, res) => {
    try {
        const posts: PageObjectResponse[] = await Promise.all(
            notionRootBlogList.map((page_id) =>
                NotionService.getPageInfo({page_id}),
            ),
        );
        res.status(HttpStatusCodes.OK).json(successResponse(req, res, posts));
    } catch (error) {
        logger.err(`Error retrieving blog posts: ${error}`);
        res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
            .json(errorResponse(req, res, "Failed to retrieve blog posts", error));
    }
});

/** Retrieve a single blog post + all its blocks
 *  GET /api/${API_VERSION}/blogs/pages/:id
 */
blogRouter.get(ENDPOINTS.blogs.pages, async (req, res) => {
    const page_id = req.params.id;
    try {
        // fetch page metadata
        const page = await NotionService.getPageInfo({page_id});
        // fetch all block children for the page
        const blocks = await NotionService.listAllBlockChildren({block_id: page_id});

        res.status(HttpStatusCodes.OK)
            .json(successResponse(req, res, {page, blocks}));
    } catch (error) {
        logger.err(`Error retrieving blog post ${page_id}: ${error}`);
        res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
            .json(errorResponse(req, res, "Failed to retrieve blog post", error));
    }
});

/** Retrieve blocks of a blog page / children of a block
 * GET /api/${API_VERSION}/blogs/blocks/:block_id/children
 */
blogRouter.get(ENDPOINTS.blogs.blockChildren, async (req, res) => {
    const block_id = req.params.block_id;
    try {
        const blocks = await NotionService.listAllBlockChildren({block_id});
        res.status(HttpStatusCodes.OK)
            .json(successResponse(req, res, blocks));
    } catch (error) {
        logger.err(`Error retrieving blocks for block ID ${block_id}: ${error}`);
        res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
            .json(errorResponse(req, res, "Failed to retrieve blocks", error));
    }
});

/** Retrieve database metadata
 * GET /api/${API_VERSION}/blogs/database/:id
 */
blogRouter.get(
    ENDPOINTS.blogs.database, async (req, res) => {
        const database_id = req.params.id;
        try {
            const database = await NotionService.getDatabase({database_id});
            res.status(HttpStatusCodes.OK)
                .json(successResponse(req, res, database));
        } catch (error) {
            logger.err(`Error retrieving database ${database_id}: ${error}`);
            res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
                .json(errorResponse(req, res, "Failed to retrieve database", error));
        }
    },
);

/** Query database entries
 * POST /api/${API_VERSION}/blogs/database/:id/query
 */
blogRouter.post(
    ENDPOINTS.blogs.queryDatabase,
    async (req, res) => {
        const database_id = req.params.id;

        try {
            const results = await NotionService.queryDatabaseAll({
                database_id,
            });
            res.status(HttpStatusCodes.OK)
                .json(successResponse(req, res, {
                    results,
                    has_more: false, // We're using queryDatabaseAll which fetches all pages
                    next_cursor: null,
                }));
        } catch (error) {
            logger.err(`Error querying database ${database_id}: ${error}`);
            res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
                .json(errorResponse(req, res, "Failed to query database", error));
        }
    },
);
