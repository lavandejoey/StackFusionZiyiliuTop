// src/routes/blogRoutes.ts
import { Router } from "express";
import { PageObjectResponse } from "@notionhq/client";
import NotionService from "@src/services/NotionService";
import type { QueryDatabaseParams } from "@src/services/NotionService";
import { NOTION_ROOT_BLOG_LIST } from "@src/common/constants/ENV";
import { errorResponse, successResponse } from "@src/common/util/response";
import HttpStatusCodes from "@src/common/constants/HttpStatusCodes";
import logger from "jet-logger";
import { ENDPOINTS } from "@src/common/constants/ENDPOINTS";
import { inspect } from "util";

const notionRootBlogList: string[] = NOTION_ROOT_BLOG_LIST
    .split(",")
    .map((id) => id.trim());

const safeStringify = (v: unknown) => {
    if (typeof v === "object" && v !== null) {
        try { return JSON.stringify(v); } catch { return inspect(v, { depth: 2 }); }
    }
    return String(v);
};
export const blogRouter = Router();

/** Retrieve all root blog posts
 *  GET /api/${API_VERSION}/blogs
 */
blogRouter.get(ENDPOINTS.blogs.homeList, async (req, res) => {
    try {
        const posts: PageObjectResponse[] = await Promise.all(
            notionRootBlogList.map((page_id) =>
                NotionService.getPageInfo({ page_id }),
            ),
        );
        res.status(HttpStatusCodes.OK).json(successResponse(req, res, posts));
    } catch (err: unknown) {
        logger.err(`Error retrieving blog posts: ${safeStringify(err)}`);
        res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
            .json(errorResponse(req, res, "Failed to retrieve blog posts", safeStringify(err)));
    }
});

/** Retrieve a single blog post + all its blocks, or a database and its pages
 *  GET /api/${API_VERSION}/blogs/pages/:id
 */
blogRouter.get(ENDPOINTS.blogs.pages, async (req, res) => {
    const { id } = req.params;
    try {
        // First, try to get it as a page
        const page = await NotionService.getPageInfo({ page_id: id });
        const blocks = await NotionService.listAllBlockChildren({ block_id: id });

        res.status(HttpStatusCodes.OK).json(successResponse(req, res, {
            type: "page",
            data: { page, blocks },
        }));
    } catch (err: unknown) {
        const asObj = (x: unknown): x is Record<string, unknown> => typeof x === "object" && x !== null;

        if (asObj(err)) {
            const eObj = err;
            if (eObj.code === "object_not_found"
                && typeof eObj.message === "string"
                && eObj.message.includes("is a database, not a page")) {
                try {
                    // Get database with data sources
                    const database = await NotionService.getDatabase({ database_id: id });
                    const pages = await NotionService.queryDatabaseAll({ database_id: id });

                    // Get first data source properties for backward compatibility
                    const dataSourceId = await NotionService.getFirstDataSourceId(id);
                    const dataSource = await NotionService.getDataSource(dataSourceId);

                    res.status(HttpStatusCodes.OK).json(successResponse(req, res, {
                        type: "database",
                        data: {
                            database: {
                                ...database,
                                // properties may exist on dataSource at runtime — stringify defensively
                                properties: (dataSource as Record<string, unknown> | null)?.properties ?? {},
                            },
                            pages,
                        },
                    }));
                } catch (dbErr: unknown) {
                    logger.err(`Error retrieving database content for ${id}: ${safeStringify(dbErr)}`);
                    res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
                        .json(errorResponse(req, res, "Failed to retrieve database content", safeStringify(dbErr)));
                }
            } else {
                logger.err(`Error retrieving content for ${id}: ${safeStringify(err)}`);
                res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
                    .json(errorResponse(req, res, "Failed to retrieve content", safeStringify(err)));
            }
        } else {
            logger.err(`Error retrieving content for ${id}: ${safeStringify(err)}`);
            res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
                .json(errorResponse(req, res, "Failed to retrieve content", safeStringify(err)));
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
    } catch (err: unknown) {
        logger.err(`Error retrieving parents for page ${page_id}: ${safeStringify(err)}`);
        res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
            .json(errorResponse(req, res, "Failed to retrieve page parents", safeStringify(err)));
    }
});

/** Retrieve blocks of a blog page / children of a block
 * GET /api/${API_VERSION}/blogs/blocks/:block_id/children
 */
blogRouter.get(ENDPOINTS.blogs.blockChildren, async (req, res) => {
    const block_id = req.params.block_id;
    try {
        const blocks = await NotionService.listAllBlockChildren({ block_id });
        res.status(HttpStatusCodes.OK)
            .json(successResponse(req, res, blocks));
    } catch (err: unknown) {
        logger.err(`Error retrieving blocks for block ID ${block_id}: ${safeStringify(err)}`);
        res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
            .json(errorResponse(req, res, "Failed to retrieve blocks", safeStringify(err)));
    }
});

/** Retrieve database metadata with data source properties
 * GET /api/${API_VERSION}/blogs/database/:id
 */
blogRouter.get(ENDPOINTS.blogs.database, async (req, res) => {
    const database_id = req.params.id;
    try {
        // Get database (contains data_sources array in 2025-09-03)
        const database = await NotionService.getDatabase({ database_id });

        // Get first data source with properties for backward compatibility
        const dataSourceId = await NotionService.getFirstDataSourceId(database_id);
        const dataSource = await NotionService.getDataSource(dataSourceId);

        // Merge properties into database object for frontend compatibility
        const ds = dataSource as Record<string, unknown> | null;
        const properties = ds && typeof ds.properties === "object" ? (ds.properties as Record<string, unknown>) : {};

        const response = {
            ...database,
            properties,
        };

        res.status(HttpStatusCodes.OK)
            .json(successResponse(req, res, response));
    } catch (err: unknown) {
        logger.err(`Error retrieving database ${database_id}: ${safeStringify(err)}`);
        res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
            .json(errorResponse(req, res, "Failed to retrieve database", safeStringify(err)));
    }
});

/** Query database entries
 * POST /api/${API_VERSION}/blogs/database/:id/query
 */
blogRouter.post(ENDPOINTS.blogs.queryDatabase, async (req, res) => {
    const database_id = req.params.id;
    const { filter, sorts } = req.body as { filter?: unknown, sorts?: unknown[] };

    try {
        const params: QueryDatabaseParams = {
            database_id,
            ...(filter !== undefined ? { filter } : {}),
            ...(sorts !== undefined ? { sorts } : {}),
        };

        const results = await NotionService.queryDatabaseAll(params);
        res.status(HttpStatusCodes.OK)
            .json(successResponse(req, res, {
                results,
                has_more: false, // We're using queryDatabaseAll which fetches all pages
                next_cursor: null,
            }));
    } catch (err: unknown) {
        logger.err(`Error querying database ${database_id}: ${safeStringify(err)}`);
        res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
            .json(errorResponse(req, res, "Failed to query database", safeStringify(err)));
    }
});
