// backend/src/services/NotionService.ts
import {Client, collectPaginatedAPI, isFullBlock, isFullDatabase, isFullPage, isFullUser} from "@notionhq/client";
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
import {NODE_ENV, NOTION_API_KEY, NOTION_CACHE_EXPIRY_SECONDS} from "@src/common/constants/ENV";
import {redisGet, redisSet} from "@src/common/util/redisClient";
import logger from "jet-logger";
import {ClientOptions} from "@notionhq/client/build/src/Client";

const notion = new Client({auth: NOTION_API_KEY} as ClientOptions);

interface PaginatedPropertyResponse {
    object: "list";
    results: PropertyItemObjectResponse[];
    has_more: boolean;
    next_cursor: string | null;
}

/**
 * Cache helper functions
 */
const getCacheKey = (method: string, params: Record<string, unknown>): string => {
    return `notion:${method}:${JSON.stringify(params)}`;
};

const getFromCache = async <T>(cacheKey: string): Promise<T | null> => {
    try {
        const cachedData = await redisGet(cacheKey);
        if (cachedData) {
            logger.info(`Cache hit for ${cacheKey}`);
            return JSON.parse(cachedData) as T;
        }
    } catch (error) {
        logger.err(`Error getting from cache: ${error}`);
    }
    return null;
};

const setToCache = async <T>(cacheKey: string, data: T): Promise<void> => {
    try {
        await redisSet(cacheKey, JSON.stringify(data), NOTION_CACHE_EXPIRY_SECONDS);
        logger.info(`Cached data for ${cacheKey}`);
    } catch (error) {
        logger.err(`Error setting cache: ${error}`);
    }
};

const NotionService = {
    /******************** BLOCKS ********************/
    /** Retrieve a single full block */
    async getBlock(
        params: GetBlockParameters,
    ): Promise<BlockObjectResponse> {
        const cacheKey = getCacheKey("getBlock", params);
        const cachedData = await getFromCache<BlockObjectResponse>(cacheKey);

        if (cachedData) {
            return cachedData;
        }

        const res = await notion.blocks.retrieve(params);
        if (!isFullBlock(res)) {
            throw new Error("Notion returned a partial block");
        }

        await setToCache(cacheKey, res);
        return res;
    },

    /** Fetch *all* full block children via pagination */
    async listAllBlockChildren(
        params: GetBlockParameters,
    ): Promise<BlockObjectResponse[]> {
        const cacheKey = getCacheKey("listAllBlockChildren", params);
        const cachedData = await getFromCache<BlockObjectResponse[]>(cacheKey);

        if (cachedData) {
            return cachedData;
        }

        const items = await collectPaginatedAPI(
            notion.blocks.children.list,
            {...params, page_size: 100},
        );
        const result = items.filter(isFullBlock);

        await setToCache(cacheKey, result);
        return result;
    },

    /** Append children to a block */
    async appendBlockChildren(
        params: AppendBlockChildrenParameters,
    ): Promise<AppendBlockChildrenResponse> {
        // Write operations aren't cached, but we should invalidate related cache entries
        const response = await notion.blocks.children.append(params);
        return response;
    },

    /******************** PAGES ********************/
    /** Retrieve a full page */
    async getPageInfo(
        params: GetPageParameters,
    ): Promise<PageObjectResponse> {
        const cacheKey = getCacheKey("getPageInfo", params);
        const cachedData = await getFromCache<PageObjectResponse>(cacheKey);

        if (cachedData) {
            return cachedData;
        }

        const res = await notion.pages.retrieve(params);
        if (!isFullPage(res)) {
            throw new Error("Notion returned a partial page");
        }

        await setToCache(cacheKey, res);
        return res;
    },

    /** Retrieve a single page property item */
    async getPageProperty(
        params: GetPagePropertyParameters,
    ) {
        const cacheKey = getCacheKey("getPageProperty", params);
        const cachedData = await getFromCache(cacheKey);

        if (cachedData) {
            return cachedData;
        }

        const result = await notion.pages.properties.retrieve(params);
        await setToCache(cacheKey, result);
        return result;
    },

    /** Fetch *all* items of a paginated page property */
    async getPagePropertyAll(
        params: GetPagePropertyParameters,
    ): Promise<PropertyItemObjectResponse[]> {
        const cacheKey = getCacheKey("getPagePropertyAll", params);
        const cachedData = await getFromCache<PropertyItemObjectResponse[]>(cacheKey);

        if (cachedData) {
            return cachedData;
        }

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

            await setToCache(cacheKey, all);
            return all;
        }

        const result = [first];
        await setToCache(cacheKey, result);
        return result;
    },

    /** Create a new page in a database */
    async createPage(
        params: CreatePageParameters,
    ): Promise<CreatePageResponse> {
        // Write operations aren't cached
        return notion.pages.create(params);
    },

    /** Update an existing page */
    async updatePage(
        params: UpdatePageParameters,
    ): Promise<UpdatePageResponse> {
        // Write operations aren't cached
        return notion.pages.update(params);
    },

    /** Retrieve all parents of a page */
    async getPageParents(
        pageId: string,
    ): Promise<(PageObjectResponse | DatabaseObjectResponse)[]> {
        const parents: (PageObjectResponse | DatabaseObjectResponse)[] = [];
        let currentParent: PageObjectResponse['parent'] | DatabaseObjectResponse['parent'] | null = null;

        // The initial ID could be a page or a database. We need to find its parent.
        try {
            const page = await this.getPageInfo({page_id: pageId});
            currentParent = page.parent;
        } catch (error) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            if (error.code === 'object_not_found' && error.message.includes('is a database, not a page')) {
                try {
                    const db = await this.getDatabase({database_id: pageId});
                    currentParent = db.parent;
                } catch (dbError) {
                    logger.err(`Could not retrieve database ${pageId}: ${dbError}`);
                    return [];
                }
            } else {
                logger.err(`Could not retrieve page ${pageId}: ${error}`);
                return [];
            }
        }

        // Now traverse up from the first parent
        for (let i = 0; i < 10 && currentParent; i++) {
            if (currentParent.type === "page_id") {
                const parentPageInfo = await this.getPageInfo({page_id: currentParent.page_id});
                parents.unshift(parentPageInfo);
                currentParent = parentPageInfo.parent;
            } else if (currentParent.type === "database_id") {
                const parentDbInfo = await this.getDatabase({database_id: currentParent.database_id});
                parents.unshift(parentDbInfo);
                currentParent = parentDbInfo.parent;
            } else { // workspace or other
                currentParent = null;
            }
        }

        return parents;
    },

    /******************** DATABASES ********************/
    /** Retrieve full database metadata */
    async getDatabase(
        params: GetDatabaseParameters,
    ): Promise<DatabaseObjectResponse> {
        const cacheKey = getCacheKey("getDatabase", params);
        const cachedData = await getFromCache<DatabaseObjectResponse>(cacheKey);

        if (cachedData) return cachedData;

        const res = await notion.databases.retrieve(params);
        if (!isFullDatabase(res)) {
            throw new Error("Notion returned a partial database");
        }

        await setToCache(cacheKey, res);
        return res;
    },

    /** Query a database with filters and sorts */
    async queryDatabase(
        params: QueryDatabaseParameters,
    ): Promise<SearchResponse> {
        const cacheKey = getCacheKey("queryDatabase", params);
        const cachedData = await getFromCache<SearchResponse>(cacheKey);

        if (cachedData) {
            return cachedData;
        }

        const result = await notion.databases.query(params);
        await setToCache(cacheKey, result);
        return result;
    },

    /** Fetch *all* pages in a database via pagination */
    async queryDatabaseAll(
        params: QueryDatabaseParameters,
    ): Promise<PageObjectResponse[]> {
        const cacheKey = getCacheKey("queryDatabaseAll", params);
        const cachedData = await getFromCache<PageObjectResponse[]>(cacheKey);

        if (cachedData) {
            return cachedData;
        }

        const pages = await collectPaginatedAPI(
            notion.databases.query,
            {...params, page_size: 100},
        );
        const result = pages.filter(isFullPage);

        await setToCache(cacheKey, result);
        return result;
    },

    /******************** SEARCH ********************/
    /** Basic search endpoint */
    async search(params: SearchParameters): Promise<SearchResponse> {
        const cacheKey = getCacheKey("search", params);
        const cachedData = await getFromCache<SearchResponse>(cacheKey);

        if (cachedData) {
            return cachedData;
        }

        const result = await notion.search(params);
        await setToCache(cacheKey, result);
        return result;
    },

    /******************** USERS ********************/
    /** Retrieve a full user */
    async getUser(
        params: GetUserParameters,
    ): Promise<UserObjectResponse> {
        const cacheKey = getCacheKey("getUser", params);
        const cachedData = await getFromCache<UserObjectResponse>(cacheKey);

        if (cachedData) {
            return cachedData;
        }

        const res = await notion.users.retrieve(params);
        if (!isFullUser(res)) {
            throw new Error("Notion returned a partial user");
        }

        await setToCache(cacheKey, res);
        return res;
    },
};

export default NotionService;