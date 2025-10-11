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
console.log(notionRootBlogList)
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

/** Retrieve a single blog post + all its blocks, or a database and its pages
 *  GET /api/${API_VERSION}/blogs/pages/:id
 */
blogRouter.get(ENDPOINTS.blogs.pages, async (req, res) => {
    const {id} = req.params;
    try {
        // First, try to get it as a page
        const page = await NotionService.getPageInfo({page_id: id});
        const blocks = await NotionService.listAllBlockChildren({block_id: id});

        res.status(HttpStatusCodes.OK).json(successResponse(req, res, {
            type: "page",
            data: {page, blocks},
        }));
    } catch (error) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        if (error.code === "object_not_found" && error.message.includes("is a database, not a page")) {
            try {
                // If it's a database, get database info and all pages in it
                const database = await NotionService.getDatabase({database_id: id});
                const pages = await NotionService.queryDatabaseAll({database_id: id});

                res.status(HttpStatusCodes.OK).json(successResponse(req, res, {
                    type: "database",
                    data: {database, pages},
                }));
            } catch (dbError) {
                logger.err(`Error retrieving database content for ${id}: ${dbError}`);
                res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
                    .json(errorResponse(req, res, "Failed to retrieve database content", dbError));
            }
        } else {
            logger.err(`Error retrieving content for ${id}: ${error}`);
            res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
                .json(errorResponse(req, res, "Failed to retrieve content", error));
        }
    }
});

/** Retrieve all parents of a blog page
 *  GET /api/${API_VERSION}/blogs/pages/:id/parents
 */
blogRouter.get(ENDPOINTS.blogs.parents, async (req, res) => {
    const page_id = req.params.id;
    try {
        const parents = await NotionService.getPageParents(page_id);
        res.status(HttpStatusCodes.OK).json(successResponse(req, res, parents));
    } catch (error) {
        logger.err(`Error retrieving parents for page ${page_id}: ${error}`);
        res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
            .json(errorResponse(req, res, "Failed to retrieve page parents", error));
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
        const { filter, sorts } = req.body;

        try {
            const results = await NotionService.queryDatabaseAll({
                database_id,
                ...(filter && { filter }),
                ...(sorts && { sorts }),
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
