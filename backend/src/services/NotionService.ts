// backend/src/services/NotionService.ts

import {
    Client,
    collectPaginatedAPI,
    isFullBlock,
    isFullDatabase,
    isFullPage,
    isFullUser,
} from "@notionhq/client";
import type {
    AppendBlockChildrenParameters,
    AppendBlockChildrenResponse,
    BlockObjectResponse,
    CreatePageParameters,
    CreatePageResponse,
    DatabaseObjectResponse,
    GetBlockParameters,
    GetDatabaseParameters,
    GetPageParameters,
    GetPagePropertyParameters,
    GetUserParameters,
    PageObjectResponse,
    PropertyItemObjectResponse,
    QueryDatabaseParameters,
    SearchParameters,
    SearchResponse,
    UpdatePageParameters,
    UpdatePageResponse,
    UserObjectResponse,
} from "@notionhq/client/build/src/api-endpoints";
import {NOTION_API_KEY} from "@src/common/constants/ENV";

const notion = new Client({auth: NOTION_API_KEY});

interface PaginatedPropertyResponse {
    object: "list";
    results: PropertyItemObjectResponse[];
    has_more: boolean;
    next_cursor: string | null;
}

const NotionService = {
    /******************** BLOCKS ********************/
    /** Retrieve a single full block */
    async getBlock(
        params: GetBlockParameters,
    ): Promise<BlockObjectResponse> {
        const res = await notion.blocks.retrieve(params);
        if (!isFullBlock(res)) {
            throw new Error("Notion returned a partial block");
        }
        return res;
    },

    /** Fetch *all* full block children via pagination */
    async listAllBlockChildren(
        params: GetBlockParameters,
    ): Promise<BlockObjectResponse[]> {
        const items = await collectPaginatedAPI(
            notion.blocks.children.list,
            {...params, page_size: 100},
        );
        return items.filter(isFullBlock);
    },

    /** Append children to a block */
    appendBlockChildren(
        params: AppendBlockChildrenParameters,
    ): Promise<AppendBlockChildrenResponse> {
        return notion.blocks.children.append(params);
    },

    /******************** PAGES ********************/
    /** Retrieve a full page */
    async getPageInfo(
        params: GetPageParameters,
    ): Promise<PageObjectResponse> {
        const res = await notion.pages.retrieve(params);
        if (!isFullPage(res)) {
            throw new Error("Notion returned a partial page");
        }
        return res;
    },

    /** Retrieve a single page property item */
    getPageProperty(
        params: GetPagePropertyParameters,
    ) {
        return notion.pages.properties.retrieve(params);
    },

    /** Fetch *all* items of a paginated page property */
    async getPagePropertyAll(
        params: GetPagePropertyParameters,
    ): Promise<PropertyItemObjectResponse[]> {
        const first = (await notion.pages.properties.retrieve(
            params,
        )) as PaginatedPropertyResponse | PropertyItemObjectResponse;

        if ("results" in first) {
            const all = [...first.results];
            let cursor = first.next_cursor;

            while (first.has_more) {
                const next = (await notion.pages.properties.retrieve({
                    ...params,
                    start_cursor: cursor ?? undefined,
                })) as PaginatedPropertyResponse;

                all.push(...next.results);
                cursor = next.next_cursor;
                if (!next.has_more) break;
            }

            return all;
        }

        return [first];
    },

    /** Create a new page in a database */
    createPage(
        params: CreatePageParameters,
    ): Promise<CreatePageResponse> {
        return notion.pages.create(params);
    },

    /** Update an existing page */
    updatePage(
        params: UpdatePageParameters,
    ): Promise<UpdatePageResponse> {
        return notion.pages.update(params);
    },

    /******************** DATABASES ********************/
    /** Retrieve full database metadata */
    async getDatabase(
        params: GetDatabaseParameters,
    ): Promise<DatabaseObjectResponse> {
        const res = await notion.databases.retrieve(params);
        if (!isFullDatabase(res)) {
            throw new Error("Notion returned a partial database");
        }
        return res;
    },

    /** Query a database with filters and sorts */
    queryDatabase(
        params: QueryDatabaseParameters,
    ): Promise<SearchResponse> {
        return notion.databases.query(params);
    },

    /** Fetch *all* pages in a database via pagination */
    async queryDatabaseAll(
        params: QueryDatabaseParameters,
    ): Promise<PageObjectResponse[]> {
        const pages = await collectPaginatedAPI(
            notion.databases.query,
            {...params, page_size: 100},
        );
        return pages.filter(isFullPage);
    },

    /******************** SEARCH ********************/
    /** Basic search endpoint */
    search(params: SearchParameters): Promise<SearchResponse> {
        return notion.search(params);
    },

    /******************** USERS ********************/
    /** Retrieve a full user */
    async getUser(
        params: GetUserParameters,
    ): Promise<UserObjectResponse> {
        const res = await notion.users.retrieve(params);
        if (!isFullUser(res)) {
            throw new Error("Notion returned a partial user");
        }
        return res;
    },
};

export default NotionService;