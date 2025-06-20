// /StackFusionZiyiliuTop/backend/src/services/NotionService.ts
// import axios from "axios";
import {
    // NOTION_API_KEY,
    NOTION_ROOT_BLOG_LIST,
} from "@src/common/constants/ENV";
// import {PageObject} from "@src/models/common/types/NotionPage";
// import {PropObject} from "@src/models/common/types/NotionProp";
// import {DatabaseObject} from "@src/models/common/types/NotionDatabase";
// import {BlockObject} from "@src/models/common/types/NotionBlock";
// import {UserObject} from "@src/models/common/types/NotionUser";
// import logger from "jet-logger";
//
// const notionApi = axios.create({
//     baseURL: "https://api.notion.com/v1",
//     headers: {
//         Authorization: `Bearer ${NOTION_API_KEY}`,
//         "Notion-Version": "2022-06-28",
//         "Content-Type": "application/json",
//     },
// });
//
// /** Retrieve a page
//  * GET /pages/:page_id
//  * @return PageObject
//  */
// export async function retrievePage(page_id: string): Promise<PageObject> {
//     const response = await notionApi.get(`/pages/${page_id}`);
//     if (response.status === 200) {
//         return response.data as PageObject;
//     } else {
//         throw new Error(`Failed to retrieve page: ${response.status} ${response.statusText}`);
//     }
// }
//
// /** Retrieve a page property item
//  * GET /pages/:page_id/properties/:property_id
//  * @return PropObject[]
//  */
// export async function retrievePagePropertyItem(page_id: string, property_id: string): Promise<PropObject[]> {
//     const response = await notionApi.get(`/pages/${page_id}/properties/${property_id}`);
//     if (response.status === 200) {
//         // response.data:
//         // 1. PropObject
//         // 2. { \"object\": \"list\", \"results\": PropObject[] }
//         const data = response.data as { object?: string, results?: PropObject[] }; // Explicitly type data
//         if (data.object === "list" && Array.isArray(data.results)) {
//             return data.results; // Return PropObject[] directly
//         } else {
//             return [data as PropObject];
//         }
//     } else {
//         throw new Error(`Failed to retrieve page property item: ${response.status} ${response.statusText}`);
//     }
// }
//
// /** Retrieve a database
//  * GET /databases/:database_id
//  * @return DatabaseObject
//  */
// export async function retrieveDatabase(database_id: string): Promise<DatabaseObject> {
//     const response = await notionApi.get(`/databases/${database_id}`);
//     if (response.status === 200) {
//         return response.data as DatabaseObject;
//     } else {
//         throw new Error(`Failed to retrieve database: ${response.status} ${response.statusText}`);
//     }
// }
//
// /** Retrieve a block
//  * GET /blocks/:block_id
//  * @return BlockObject
//  */
// export async function retrieveBlock(block_id: string): Promise<BlockObject> {
//     const response = await notionApi.get(`/blocks/${block_id}`);
//     if (response.status === 200) {
//         return response.data as BlockObject;
//     } else {
//         throw new Error(`Failed to retrieve block: ${response.status} ${response.statusText}`);
//     }
// }
//
// /** Retrieve block children
//  * GET /blocks/:block_id/children
//  * @return BlockObject[]
//  */
// export async function retrieveBlockChildren(block_id: string): Promise<BlockObject[]> {
//     const response = await notionApi.get(`/blocks/${block_id}/children`);
//     const data = response.data as { object?: string, results?: BlockObject[] };
//     if (response.status === 200 && Array.isArray(data.results)) {
//         return data.results;
//     } else {
//         throw new Error(`Failed to retrieve block children: ${response.status} ${response.statusText}`);
//     }
// }
//
// /** List all users
//  * GET /users
//  * @return UserObject[]
//  */
// export async function listUsers(): Promise<UserObject[]> {
//     const response = await notionApi.get("/users");
//     const data = response.data as { object?: string, results?: UserObject[] };
//     if (response.status === 200 && Array.isArray(data.results)) {
//         return data.results;
//     } else {
//         throw new Error(`Failed to list users: ${response.status} ${response.statusText}`);
//     }
// }
//
// /** Retrieve a user
//  * GET /users/:user_id
//  * @return UserObject
//  */
// export async function retrieveUser(user_id: string): Promise<UserObject> {
//     const response = await notionApi.get(`/users/${user_id}`);
//     if (response.status === 200) {
//         return response.data as UserObject;
//     } else {
//         throw new Error(`Failed to retrieve user: ${response.status} ${response.statusText}`);
//     }
// }
//
// /** Retrieve your token's bot user
//  * GET /users/me
//  * @return UserObject
//  */
// export async function retrieveMyBotUser(): Promise<UserObject> {
//     const response = await notionApi.get("/users/me");
//     if (response.status === 200) {
//         return response.data as UserObject;
//     } else {
//         throw new Error(`Failed to retrieve bot user: ${response.status} ${response.statusText}`);
//     }
// }

// TODO
export async function rootBlogList(): Promise<unknown[]> {
    // Fetch the pages in NOTION_ROOT_BLOG_LIST
    const rootPageIds = NOTION_ROOT_BLOG_LIST.split(",");
    const pages: unknown[] = [];
    for (const pageId of rootPageIds) {
        try {
            // dummy function to retrieve a page
            // const page = await retrievePage(pageId);
            // Mocked page object
            const page = await new Promise((resolve) => {
                resolve({
                    id: pageId,
                    title: `Page Title for ${pageId}`,
                    iconHtml: `<i class="icon-${pageId}"></i>`,
                    cover: null,
                    formattedLastEdited: new Date().toISOString(),
                });
            });
            pages.push(page);
        } catch { // Explicitly type error
            // logger.err(`Failed to fetch page ${pageId}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    return pages;
}