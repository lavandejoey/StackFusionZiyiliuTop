// models/Notion.js
const redisClient = require("../packages/redisClient.package.js");
const katex = require('katex');

/**
 * BaseObject class handles shared properties and validation for Notion objects.
 */
class BaseObject {
    constructor(data, type) {
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

    _validateRequiredFields() {
        if (!this.id || !this.created_time) {
            throw new Error(`Missing required fields in ${this.object} object`);
        }
    }

    // Returns HTML for the icon with restricted size (32px)
    get iconHtml() {
        const size = '32px';
        if (!this.icon) return '';
        if (this.icon.type === 'emoji') {
            return `<span style="font-size: ${size}; display: inline-block; width: ${size}; height: ${size}; line-height: ${size}; text-align: center;">${this.icon.emoji}</span>`;
        }
        if (this.icon.type === 'external' && this.icon.external && this.icon.external.url) {
            return `<img src="${this.icon.external.url}" alt="Page Icon" style="max-width: ${size}; max-height: ${size}; width: auto; height: auto;">`;
        }
        return '';
    }
}

/**
 * Block class represents a content block in Notion.
 */
class Block extends BaseObject {
    constructor(data) {
        super(data, "block");
        this.parent = new Parent(data.parent);
        this.type = data.type;
        this.has_children = data.has_children ?? false;
        this.data = data[data.type] || {};
    }

    renderRichText() {
        if (!this.data.rich_text) return '';
        return Block.renderText(this.data.rich_text);
    }

    static renderText(data) {
        data = Array.isArray(data) ? data : [data];
        return data.map(rt => {
            let text = rt.plain_text;
            if (rt.annotations) {
                if (rt.annotations.bold) text = `<strong>${text}</strong>`;
                if (rt.annotations.italic) text = `<em>${text}</em>`;
                if (rt.annotations.underline) text = `<u>${text}</u>`;
                if (rt.annotations.strikethrough) text = `<s>${text}</s>`;
                if (rt.annotations.code) text = `<code>${text}</code>`;
                if (rt.annotations.color && rt.annotations.color !== 'default') {
                    text = `<span style="color:${rt.annotations.color};">${text}</span>`;
                }
            }
            if (rt.href) text = `<a href="${rt.href}" target="_blank">${text}</a>`;
            if (rt.type === 'equation' && rt.equation) {
                text = `<span class="katex">${katex.renderToString(rt.equation.expression, {
                    displayMode: false,
                    throwOnError: true,
                    output: "mathml"
                })}</span>`;
            }
            return text;
        }).join('');
    }

    renderBulletedListItem(isLast = false) {
        const richTextHtml = this.renderRichText();
        const colorClass = this.data.color !== 'default' ? `text-${this.data.color}` : '';
        const marginClass = isLast ? 'mb-3' : '';
        return `<li class="${colorClass} ${marginClass}">${richTextHtml}</li>`;
    }

    // Override iconHtml for blocks to prevent using the parent's implementation.
    get iconHtml() {
        return '';
    }
}

/**
 * Page class represents a Notion page.
 */
class Page extends BaseObject {
    constructor(data) {
        super(data, "page");
        this.parent = new Parent(data.parent);
        this.icon = data.icon || null;
        this.cover = data.cover || null;
        this.properties = data.properties || {};
        this.url = data.url || null;
        this.public_url = data.public_url || null;
    }

    // Returns a formatted string for the last edited time.
    get formattedLastEdited() {
        if (!this.last_edited_time) return '';
        return `Updated at ${new Date(this.last_edited_time).toLocaleString()}`;
    }

    // Returns the page title by searching for a property of type "title".
    get title() {
        for (const key in this.properties) {
            const prop = this.properties[key];
            if (prop.type === 'title' && Array.isArray(prop.title) && prop.title.length > 0) {
                return prop.title[0].plain_text;
            }
        }
        return 'Untitled';
    }
}

/**
 * Database class represents a Notion database.
 */
class Database extends BaseObject {
    constructor(data) {
        super(data, "database");
        this.parent = new Parent(data.parent);
        this.title = data.title || [];
        this.description = data.description || [];
        this.icon = data.icon || null;
        this.cover = data.cover || null;
        this.properties = data.properties || {};
        this.is_inline = data.is_inline ?? false;
        this.url = data.url || null;
        this.public_url = data.public_url || null;
    }
}

/**
 * Parent class for nested Notion objects.
 */
class Parent {
    constructor(data) {
        if (!data || !data.type) {
            throw new Error("Invalid parent data");
        }
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
                this.workspace = data.workspace === true;
                break;
            default:
                throw new Error(`Unknown parent type: ${data.type}`);
        }
    }
}

/**
 * User class represents a user in Notion.
 */
class User {
    constructor(data) {
        if (!data || data.object !== "user") {
            throw new Error("Invalid user data");
        }
        this.object = data.object;
        this.id = data.id;
        this.type = data.type || "person";
        this.name = data.name || "Unknown";
        this.avatar_url = data.avatar_url || null;
    }
}

/**
 * NotionAPI class encapsulates static methods to call Notion's REST API.
 */
class API {
    /**
     * Returns headers required for all Notion API requests.
     */
    static headers() {
        return {
            'Authorization': `Bearer ${process.env.NOTION_API_KEY}`,
            'Notion-Version': '2022-06-28',
            'Content-Type': 'application/json'
        };
    }

    /**
     * Helper method to cache API responses.
     * @param {string} key - Redis key.
     * @param {Function} fetchFunc - Async function that returns the data.
     * @param {number} expiry - Expiration time in seconds (default 43200 = 12h).
     */
    static async cacheFetch(key, fetchFunc, expiry = 43200) {
        let cache = await redisClient.get(key);
        if (cache) {
            return JSON.parse(cache);
        } else {
            const data = await fetchFunc();
            await redisClient.set(key, JSON.stringify(data), 'EX', expiry);
            return data;
        }
    }

    /**
     * Retrieves a block by ID.
     */
    static async retrieveBlock(blockId) {
        const cacheKey = `notion:block:${blockId}`;
        const data = await this.cacheFetch(cacheKey, async () => {
            const res = await fetch(`https://api.notion.com/v1/blocks/${blockId}`, {
                method: 'GET',
                headers: this.headers()
            });
            const json = await res.json();
            if (!res.ok) {
                throw new Error(json.message || 'Error retrieving block');
            }
            return json;
        });
        return new Block(data);
    }

    /**
     * Retrieves children of a block.
     */
    static async getBlockChildren(blockId, options = {}) {
        const cacheKey = `notion:blockChildren:${blockId}:${options.start_cursor || ''}:${options.page_size || ''}`;
        const data = await this.cacheFetch(cacheKey, async () => {
            const url = new URL(`https://api.notion.com/v1/blocks/${blockId}/children`);
            if (options.start_cursor) url.searchParams.append('start_cursor', options.start_cursor);
            if (options.page_size) url.searchParams.append('page_size', options.page_size);
            const res = await fetch(url.toString(), {
                method: 'GET',
                headers: this.headers()
            });
            const json = await res.json();
            if (!res.ok) {
                throw new Error(json.message || 'Error retrieving block children');
            }
            return json;
        });
        data.results = data.results.map(blockData => new Block(blockData));
        return data;
    }

    /**
     * Retrieves a page by ID.
     */
    static async retrievePage(pageId) {
        const cacheKey = `notion:page:${pageId}`;
        const data = await this.cacheFetch(cacheKey, async () => {
            const res = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
                method: 'GET',
                headers: this.headers()
            });
            const json = await res.json();
            if (!res.ok) {
                throw new Error(json.message || 'Error retrieving page');
            }
            return json;
        });
        return new Page(data);
    }

    /**
     * Retrieves a specific property of a page.
     */
    static async retrievePageProperty(pageId, propertyId) {
        const cacheKey = `notion:pageProperty:${pageId}:${propertyId}`;
        return this.cacheFetch(cacheKey, async () => {
            const res = await fetch(`https://api.notion.com/v1/pages/${pageId}/properties/${propertyId}`, {
                method: 'GET',
                headers: this.headers()
            });
            const json = await res.json();
            if (!res.ok) {
                throw new Error(json.message || 'Error retrieving page property');
            }
            return json;
        });
    }

    /**
     * Retrieves a database by querying it.
     */
    static async queryDatabase(databaseId, queryData = {}) {
        const cacheKey = `notion:databaseQuery:${databaseId}:${JSON.stringify(queryData)}`;
        return this.cacheFetch(cacheKey, async () => {
            const res = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
                method: 'POST',
                headers: this.headers(),
                body: JSON.stringify(queryData)
            });
            const json = await res.json();
            if (!res.ok) {
                throw new Error(json.message || 'Error querying database');
            }
            return json;
        });
    }

    /**
     * Retrieves a database by ID.
     */
    static async retrieveDatabase(databaseId) {
        const cacheKey = `notion:database:${databaseId}`;
        const data = await this.cacheFetch(cacheKey, async () => {
            const res = await fetch(`https://api.notion.com/v1/databases/${databaseId}`, {
                method: 'GET',
                headers: this.headers()
            });
            const json = await res.json();
            if (!res.ok) {
                throw new Error(json.message || 'Error retrieving database');
            }
            return json;
        });
        return new Database(data);
    }

    /**
     * Searches across Notion content.
     */
    static async search(queryData) {
        const cacheKey = `notion:search:${JSON.stringify(queryData)}`;
        return this.cacheFetch(cacheKey, async () => {
            const res = await fetch(`https://api.notion.com/v1/search`, {
                method: 'POST',
                headers: this.headers(),
                body: JSON.stringify(queryData)
            });
            const json = await res.json();
            if (!res.ok) {
                throw new Error(json.message || 'Error performing search');
            }
            return json;
        });
    }

    /**
     * Retrieves a list of users in the workspace.
     */
    static async getUsers() {
        const cacheKey = `notion:users`;
        const data = await this.cacheFetch(cacheKey, async () => {
            const res = await fetch(`https://api.notion.com/v1/users`, {
                method: 'GET',
                headers: this.headers()
            });
            const json = await res.json();
            if (!res.ok) {
                throw new Error(json.message || 'Error retrieving users');
            }
            return json;
        });
        return data.results.map(userData => new User(userData));
    }

    /**
     * Retrieves a single user by ID.
     */
    static async retrieveUser(userId) {
        const cacheKey = `notion:user:${userId}`;
        const data = await this.cacheFetch(cacheKey, async () => {
            const res = await fetch(`https://api.notion.com/v1/users/${userId}`, {
                method: 'GET',
                headers: this.headers()
            });
            const json = await res.json();
            if (!res.ok) {
                throw new Error(json.message || 'Error retrieving user');
            }
            return json;
        });
        return new User(data);
    }
}

module.exports = {Block, Page, Database, Parent, User, NotionAPI: API};
