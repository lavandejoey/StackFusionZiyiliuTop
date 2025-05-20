// /StackFusionZiyiliuTop/backend/src/models/Notion.model.ts
import katex from "katex";
import {redisClient} from "utils/redisClient.util";

export interface NotionObject {
    object: string;
    id: string;
    created_time: string;
    created_by: any;
    last_edited_time: string;
    last_edited_by: any;
    archived?: boolean;
    in_trash?: boolean;

    [key: string]: any;
}

export interface FetchOptions {
    start_cursor?: string;
    page_size?: number;
}

/**
 * BaseObject handles shared Notion‐API fields & validation.
 */
export class BaseObject {
    object: string;
    id: string;
    created_time: string;
    created_by: any;
    last_edited_time: string;
    last_edited_by: any;
    archived: boolean;
    in_trash: boolean;
    icon?: any;
    cover?: any;

    constructor(data: NotionObject, type: string) {
        if (!data || data.object !== type) {
            throw new Error(`Invalid ${type} data`);
        }
        this.object = data.object;
        this.id = data.id;
        this.created_time = data.created_time;
        this.created_by = data.created_by;
        this.last_edited_time = data.last_edited_time;
        this.last_edited_by = data.last_edited_by;
        this.archived = data.archived ?? false;
        this.in_trash = data.in_trash ?? false;
        this._validateRequiredFields();
    }

    protected _validateRequiredFields(): void {
        if (!this.id || !this.created_time) {
            throw new Error(`Missing required fields in ${this.object} object`);
        }
    }

    /**
     * Render the page/icon emoji or external‐URL to a 32px HTML snippet.
     */
    get iconHtml(): string {
        const size = "32px";
        if (!this.icon) return "";
        if (this.icon.type === "emoji") {
            return `<span style="font-size:${size};display:inline-block;width:${size};height:${size};line-height:${size};text-align:center">
                ${this.icon.emoji}
              </span>`;
        }
        if (this.icon.type === "external" && this.icon.external?.url) {
            return `<img src="${this.icon.external.url}" alt="Icon" 
                   style="max-width:${size};max-height:${size};width:auto;height:auto" />`;
        }
        return "";
    }
}

/**
 * Represents a single Notion block (paragraph, heading, list, etc.).
 */
export class Block extends BaseObject {
    parent: Parent;
    type: string;
    has_children: boolean;
    data: any;

    constructor(data: any) {
        super(data, "block");
        this.parent = new Parent(data.parent);
        this.type = data.type;
        this.has_children = data.has_children ?? false;
        this.data = data[this.type] || {};
    }

    renderRichText(): string {
        if (!this.data.rich_text) return "";
        return Block.renderText(this.data.rich_text);
    }

    static renderText(
        rich: Array<{ plain_text: string; annotations?: any; href?: string; type?: string; equation?: any }> | any
    ): string {
        const arr = Array.isArray(rich) ? rich : [rich];
        return arr
            .map((rt) => {
                let txt = rt.plain_text;
                const a = rt.annotations ?? {};
                if (a.bold) txt = `<strong>${txt}</strong>`;
                if (a.italic) txt = `<em>${txt}</em>`;
                if (a.underline) txt = `<u>${txt}</u>`;
                if (a.strikethrough) txt = `<s>${txt}</s>`;
                if (a.code) txt = `<code>${txt}</code>`;
                if (a.color && a.color !== "default") {
                    txt = `<span style="color:${a.color}">${txt}</span>`;
                }
                if (rt.href) {
                    txt = `<a href="${rt.href}" target="_blank">${txt}</a>`;
                }
                if (rt.type === "equation" && rt.equation) {
                    txt = `<span class="katex">
                   ${katex.renderToString(rt.equation.expression, {
                        displayMode: false,
                        throwOnError: true,
                        output: "mathml",
                    })}
                 </span>`;
                }
                return txt;
            })
            .join("");
    }

    renderBulletedListItem(isLast = false): string {
        const html = this.renderRichText();
        const colorClass = this.data.color !== "default" ? `text-${this.data.color}` : "";
        const margin = isLast ? "mb-3" : "";
        return `<li class="${colorClass} ${margin}">${html}</li>`;
    }

    /** Blocks never show an icon by themselves */
    get iconHtml(): string {
        return "";
    }
}

/**
 * Represents a Notion page object (with properties, title, etc.).
 */
export class Page extends BaseObject {
    parent: Parent;
    icon: any | null;
    cover: any | null;
    properties: Record<string, any>;
    url: string | null;
    public_url: string | null;

    constructor(data: any) {
        super(data, "page");
        this.parent = new Parent(data.parent);
        this.icon = data.icon ?? null;
        this.cover = data.cover ?? null;
        this.properties = data.properties ?? {};
        this.url = data.url ?? null;
        this.public_url = data.public_url ?? null;
    }

    get formattedLastEdited(): string {
        return this.last_edited_time
            ? `Updated at ${new Date(this.last_edited_time).toLocaleString()}`
            : "";
    }

    get title(): string {
        for (const key in this.properties) {
            const prop = this.properties[key];
            if (prop.type === "title" && Array.isArray(prop.title) && prop.title.length) {
                return prop.title[0].plain_text;
            }
        }
        return "Untitled";
    }
}

/**
 * Represents a Notion database object.
 */
export class Database extends BaseObject {
    parent: Parent;
    title: any[];
    description: any[];
    icon: any | null;
    cover: any | null;
    properties: Record<string, any>;
    is_inline: boolean;
    url: string | null;
    public_url: string | null;

    constructor(data: any) {
        super(data, "database");
        this.parent = new Parent(data.parent);
        this.title = data.title ?? [];
        this.description = data.description ?? [];
        this.icon = data.icon ?? null;
        this.cover = data.cover ?? null;
        this.properties = data.properties ?? {};
        this.is_inline = data.is_inline ?? false;
        this.url = data.url ?? null;
        this.public_url = data.public_url ?? null;
    }
}

/**
 * Parent pointer (page_id, database_id, block_id or workspace).
 */
export class Parent {
    type: string;
    id: string;
    workspace?: boolean;

    constructor(data: any) {
        if (!data || !data.type) throw new Error("Invalid parent data");
        this.type = data.type;
        switch (data.type) {
            case "database_id":
                this.id = data.database_id;
                break;
            case "page_id":
                this.id = data.page_id;
                break;
            case "block_id":
                this.id = data.block_id;
                break;
            case "workspace":
                this.id = data.workspace;
                this.workspace = true;
                break;
            default:
                throw new Error(`Unknown parent type: ${data.type}`);
        }
    }
}

/**
 * Represents a Notion user.
 */
export class User {
    object: "user";
    id: string;
    type: string;
    name: string;
    avatar_url: string | null;

    constructor(data: any) {
        if (!data || data.object !== "user") {
            throw new Error("Invalid user data");
        }
        this.object = "user";
        this.id = data.id;
        this.type = data.type ?? "person";
        this.name = data.name ?? "Unknown";
        this.avatar_url = data.avatar_url ?? null;
    }
}

/**
 * Static methods for calling Notion’s REST API, with Redis caching.
 */
export class NotionAPI {
    static headers(): Record<string, string> {
        return {
            Authorization: `Bearer ${process.env.NOTION_API_KEY}`,
            "Notion-Version": "2022-06-28",
            "Content-Type": "application/json",
        };
    }

    static async cacheFetch<T>(
        key: string,
        fetchFunc: () => Promise<T>,
        expiry = 12 * 3600
    ): Promise<T> {
        const cached = await redisClient.get(key);
        if (cached) return JSON.parse(cached) as T;

        const data = await fetchFunc();
        await redisClient.set(key, JSON.stringify(data), "EX", expiry);
        return data;
    }

    static async retrieveBlock(blockId: string): Promise<Block> {
        const data = await this.cacheFetch(`notion:block:${blockId}`, async () => {
            const res = await fetch(`https://api.notion.com/v1/blocks/${blockId}`, {
                headers: this.headers(),
            });
            if (!res.ok) throw new Error((await res.json()).message);
            return res.json();
        });
        return new Block(data);
    }

    static async getBlockChildren(
        blockId: string,
        options: FetchOptions = {}
    ): Promise<{ results: Block[]; next_cursor: string | null; has_more: boolean }> {
        const data = await this.cacheFetch(
            `notion:blockChildren:${blockId}:${options.start_cursor || ""}:${options.page_size || ""}`,
            async () => {
                const url = new URL(`https://api.notion.com/v1/blocks/${blockId}/children`);
                if (options.start_cursor) url.searchParams.append("start_cursor", options.start_cursor);
                if (options.page_size) url.searchParams.append("page_size", `${options.page_size}`);
                const res = await fetch(url.toString(), {headers: this.headers()});
                if (!res.ok) throw new Error((await res.json()).message);
                return res.json();
            }
        );
        return {
            ...data,
            results: data.results.map((b: any) => new Block(b)),
        };
    }

    static async retrievePage(pageId: string): Promise<Page> {
        const data = await this.cacheFetch(`notion:page:${pageId}`, async () => {
            const res = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
                headers: this.headers(),
            });
            if (!res.ok) throw new Error((await res.json()).message);
            return res.json();
        });
        return new Page(data);
    }

    static async retrievePageProperty(pageId: string, propertyId: string): Promise<any> {
        return this.cacheFetch(`notion:pageProperty:${pageId}:${propertyId}`, async () => {
            const res = await fetch(
                `https://api.notion.com/v1/pages/${pageId}/properties/${propertyId}`,
                {headers: this.headers()}
            );
            if (!res.ok) throw new Error((await res.json()).message);
            return res.json();
        });
    }

    static async queryDatabase(databaseId: string, queryData: any = {}): Promise<any> {
        return this.cacheFetch(`notion:databaseQuery:${databaseId}:${JSON.stringify(queryData)}`, async () => {
            const res = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
                method: "POST",
                headers: this.headers(),
                body: JSON.stringify(queryData),
            });
            if (!res.ok) throw new Error((await res.json()).message);
            return res.json();
        });
    }

    static async retrieveDatabase(databaseId: string): Promise<Database> {
        const data = await this.cacheFetch(`notion:database:${databaseId}`, async () => {
            const res = await fetch(`https://api.notion.com/v1/databases/${databaseId}`, {
                headers: this.headers(),
            });
            if (!res.ok) throw new Error((await res.json()).message);
            return res.json();
        });
        return new Database(data);
    }

    static async search(queryData: any): Promise<any> {
        return this.cacheFetch(`notion:search:${JSON.stringify(queryData)}`, async () => {
            const res = await fetch("https://api.notion.com/v1/search", {
                method: "POST",
                headers: this.headers(),
                body: JSON.stringify(queryData),
            });
            if (!res.ok) throw new Error((await res.json()).message);
            return res.json();
        });
    }

    static async getUsers(): Promise<User[]> {
        const data = await this.cacheFetch("notion:users", async () => {
            const res = await fetch("https://api.notion.com/v1/users", {headers: this.headers()});
            if (!res.ok) throw new Error((await res.json()).message);
            return res.json();
        });
        return data.results.map((u: any) => new User(u));
    }

    static async retrieveUser(userId: string): Promise<User> {
        const data = await this.cacheFetch(`notion:user:${userId}`, async () => {
            const res = await fetch(`https://api.notion.com/v1/users/${userId}`, {
                headers: this.headers(),
            });
            if (!res.ok) throw new Error((await res.json()).message);
            return res.json();
        });
        return new User(data);
    }
}
