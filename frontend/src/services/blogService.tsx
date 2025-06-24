// /frontend/src/services/blogService.tsx
import type {BlockObjectResponse, DatabaseObjectResponse, PageObjectResponse,} from "@notionhq/client";
import {BlogsAPI} from "@/services/axios";

export interface BlogPostResponse {
    page: PageObjectResponse;
    blocks: BlockObjectResponse[];
}

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


/**
 * Fetches a single blog post by its ID with only root level blocks.
 * GET /api/${version}/blog/pages/:id
 * This is a more performant initial load without retrieving all nested blocks.
 */
export async function getBlogPostBasic(pageId: string): Promise<BlogPostResponse> {
    const pageResponse = await BlogsAPI.pages(pageId);
    if (!pageResponse.data || !pageResponse.data.data)
        throw new Error(`Failed to fetch blog post with ID ${pageId}`);

    const blocksResponse = await BlogsAPI.blockChildren(pageId);
    if (!blocksResponse.data || !blocksResponse.data.data)
        throw new Error(`Failed to fetch blocks for blog post with ID ${pageId}`);

    // Only return the first level blocks without fetching children
    return {
        page: pageResponse.data.data.page as PageObjectResponse,
        blocks: blocksResponse.data.data as BlockObjectResponse[],
    };
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
    filter?: object,
    sorts?: object[]
): Promise<DatabaseQueryResponse> {
    const response = await BlogsAPI.queryDatabase(databaseId, {filter, sorts});
    if (!response.data || !response.data.data)
        throw new Error(`Failed to query database with ID ${databaseId}`);

    return response.data.data as DatabaseQueryResponse;
}
