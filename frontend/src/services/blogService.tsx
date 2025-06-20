// /StackFusionZiyiliuTop/frontend/src/services/blogService.tsx
import api from "./axios";
import Paths from "@/constants/Paths";

export interface PageCard {
    id: string,
    title: string,
    iconHtml: string,
    cover: string | null;
    formattedLastEdited: string,
}

/**
 * Fetches all blog pages.
 * GET /api/${version}/blog/all
 */
export async function getAllBlogPages(): Promise<PageCard[]> {
    const response = await api.get(
        `${Paths.Blog.Base}${Paths.Blog.GetAll}`
    );
    // assumes response.data.data is an array of pages
    return response.data.data as PageCard[];
}
