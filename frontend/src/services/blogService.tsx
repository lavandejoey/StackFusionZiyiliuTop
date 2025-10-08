// /frontend/src/services/blogService.tsx
import type {BlockObjectResponse, DatabaseObjectResponse, PageObjectResponse,} from "@notionhq/client";
import {BlogsAPI} from "@/services/axios";

export type BlogPostResponse = {
    type: "page";
    data: {
        page: PageObjectResponse;
        blocks: BlockObjectResponse[];
    };
} | {
    type: "database";
    data: {
        database: DatabaseObjectResponse;
        pages: PageObjectResponse[];
    };
};

export interface DatabaseQueryResponse {
    results: PageObjectResponse[];
    has_more: boolean;
    next_cursor: string | null;
}

/**
 * Fetches all blog pages.
 * GET /api/${version}/blog/all
 */
export async function getAllBlogPages(): Promise<PageObjectResponse[]> {
    const response = await BlogsAPI.homeList();
    return response.data.data as PageObjectResponse[];
}

export type BlogParent = PageObjectResponse | DatabaseObjectResponse;

/**
 * Fetches parents of a single blog post by its ID.
 * GET /api/${version}/blog/pages/:id/parents
 */
export async function getBlogPostParents(pageId: string): Promise<BlogParent[]> {
    const response = await BlogsAPI.parents(pageId);
    if (!response.data || !response.data.data)
        throw new Error(`Failed to fetch parents for blog post with ID ${pageId}`);
    return response.data.data as BlogParent[];
}

/**
 * Fetches a single blog post by its ID with only root level blocks.
 * GET /api/${version}/blog/pages/:id
 * This is a more performant initial load without retrieving all nested blocks.
 */
export async function getBlogPostBasic(pageId: string): Promise<BlogPostResponse> {
    const response = await BlogsAPI.pages(pageId);
    if (!response.data || !response.data.data)
        throw new Error(`Failed to fetch blog post with ID ${pageId}`);

    return response.data.data as BlogPostResponse;
}

/**
 * Fetches child blocks for a specific parent block.
 * GET /api/${version}/blog/blocks/:block_id/children/all
 */
export async function getChildBlocks(blockId: string): Promise<BlockObjectResponse[]> {
    const response = await BlogsAPI.blockChildren(blockId);
    if (!response.data || !response.data.data)
        throw new Error(`Failed to fetch child blocks for block ID ${blockId}`);

    return response.data.data as BlockObjectResponse[];
}

/**
 * Fetches database metadata by its ID
 * GET /api/${version}/blog/database/:id
 */
export async function getDatabase(databaseId: string): Promise<DatabaseObjectResponse> {
    const response = await BlogsAPI.database(databaseId);
    if (!response.data || !response.data.data)
        throw new Error(`Failed to fetch database with ID ${databaseId}`);

    return response.data.data as DatabaseObjectResponse;
}

/**
 * Queries database entries
 * POST /api/${version}/blog/database/:id/query
 */
export async function queryDatabase(
    databaseId: string,
    options?: {
        filter?: object;
        sorts?: object[];
    }
): Promise<DatabaseQueryResponse> {
    const response = await BlogsAPI.queryDatabase(databaseId, {
        filter: options?.filter,
        sorts: options?.sorts
    });
    if (!response.data || !response.data.data)
        throw new Error(`Failed to query database with ID ${databaseId}`);

    return response.data.data as DatabaseQueryResponse;
}
