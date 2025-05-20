// /StackFusionZiyiliuTop/backend/src/api/v1/blogRouter.ts
import {Router, Request, Response, NextFunction, json} from "express";
import katex from "katex";
import process from "node:process";
import {errorResponse} from "middlewares/response";
import {Block, Database, NotionAPI, Page} from "models/Notion.model";
import axios from "axios";

const blogRouter = Router();
const rootPageIds = String(process.env.NOTION_ROOT_BLOG_LIST).split(",");

async function fetchChildrenRecursive(blocks: Block[]) {
    for (const blk of blocks) {
        if (blk.has_children) {
            const children = await NotionAPI.getBlockChildren(blk.id);
            blk.children = children.results as Block[];
            await fetchChildrenRecursive(blk.children);
        }
    }
}

async function renderBlock(blk: Block, lvl = 0): Promise<string> {
    let html = "";
    const indent = "  ".repeat(lvl);
    let skipChildren = false;

    switch (blk.type) {
        case "paragraph":
            html += blk.data.rich_text?.length
                ? `<p>${indent}${blk.renderRichText()}</p>`
                : `<p></p>`;
            break;

        case "heading_1":
        case "heading_2":
        case "heading_3": {
            const n = blk.type.split("_")[1];
            const tag = `h${n}`;
            const text = blk.renderRichText();
            const slug = text.replace(/<[^>]+>/g, "").replace(/[^a-zA-Z0-9 ]/g, "").replace(/ /g, "-");
            html += `<${tag} id="${slug}">${text}</${tag}>`;
            break;
        }

        case "divider":
            html += `<hr/>`;
            break;

        case "quote":
            html += `<blockquote class="blockquote">${blk.renderRichText()}</blockquote>`;
            break;

        case "table_of_contents":
            html += `<div class="container toc"></div>`;
            break;

        case "column_list":
            skipChildren = true;
            html += `<div class="row">`;
            for (const col of blk.children as Block[]) {
                html += `<div class="col">${await renderBlock(col, lvl + 1)}</div>`;
            }
            html += `</div>`;
            break;

        case "column":
            skipChildren = true;
            skipChildren = true;
            // inline all children of a column
            for (const child of blk.children as Block[]) {
                html += await renderBlock(child, lvl + 1);
            }
            break;

        case "table":
            skipChildren = true;
            html += `<table class="table">`;
            if (blk.data.has_column_header) {
                html += `<thead><tr>`;
                for (const cell of blk.children?.[0]?.data?.cells || []) {
                    html += `<th>${Block.renderText(cell)}</th>`;
                }
                html += `</tr></thead><tbody>`;
            } else {
                html += `<tbody>`;
            }
            const start = blk.data.has_column_header ? 1 : 0;
            for (let i = start; i < (blk.children?.length || 0); i++) {
                html += `<tr>`;
                for (const cell of blk.children?.[i]?.data?.cells || []) {
                    html += `<td>${Block.renderText(cell)}</td>`;
                }
                html += `</tr>`;
            }
            html += `</tbody></table>`;
            break;

        case "child_database": {
            const db = new Database(await NotionAPI.retrieveDatabase(blk.id));
            const rows = await NotionAPI.queryDatabase(blk.id);
            html += `<div class="lead">${db.iconHtml}&nbsp;${Block.renderText(db.title)}</div>`;
            html +=
                '<div class="table-responsive"><table class="table"><thead><tr><th>Doc name</th><th>Last updated</th><th>Created by</th></tr></thead><tbody>';
            for (let row of rows.results) {
                row = new Page(row);
                html += `<tr><td><a href="/blog/${row.id}">${row.iconHtml}&nbsp;${row.title}</a></td><td>${new Date(
                    row.last_edited_time
                ).toLocaleString()}</td><td>${
                    row.properties["Created by"]?.created_by?.name ?? "—"
                }</td></tr>`;
            }
            html += "</tbody></table></div>";
            break;
        }

        case "table_row":
            // already handled inside <table>; suppress default
            return "";

        case "link_preview":
            const url = blk.data.url;
            const cap = blk.data.caption ? Block.renderText(blk.data.caption) : "";
            html += `<div class="link-preview">
                 <a href="${url}" target="_blank">${url}</a>
                 ${cap ? `<div class="caption">${cap}</div>` : ""}
               </div>`;
            break;

        case "code":
            if (blk.data.language === "mermaid") {
                html += `<div class="mermaid">${blk.data.rich_text?.[0]?.plain_text}</div>`;
                if (blk.data.caption?.length) {
                    html += `<p class="text-center">${blk.data.caption[0].plain_text}</p>`;
                }
            } else {
                html += `<figure class="highlight">
                   <pre><code class="language-${blk.data.language}">${blk.data.rich_text?.[0]?.plain_text}</code></pre>`;
                if (blk.data.caption?.length) {
                    html += `<figcaption class="text-center">${blk.data.caption[0].plain_text}</figcaption>`;
                }
                html += `</figure>`;
            }
            break;

        case "equation":
            html += `<div class="text-center my-2">
                 <span class="katex">${katex.renderToString(
                blk.data.expression,
                {displayMode: true, throwOnError: true, output: "mathml"}
            )}</span>
               </div>`;
            break;

        case "image": {
            // Point to our proxy rather than directly embedding the expiring URL
            const src = `/api/${process.env.API_VERSION}/blog/media/image/${blk.id}`;
            // Optional caption rendering
            const captionHtml = blk.data.caption?.length
                ? `<figcaption>${Block.renderText(blk.data.caption)}</figcaption>`
                : "";
            html += `<figure class="text-center"><img src="${src}" class="img-fluid" alt="${captionHtml ? "Image with caption" : ""}" />${captionHtml}</figure>`;
            break;
        }

        default:
            html += `<p>Unhandled block type ${blk.type}</p>`;
        // TODO: handle embed, synced_block, etc.
    }

    if (!skipChildren && blk.children?.length) {
        for (const child of blk.children as Block[]) {
            html += await renderBlock(child, lvl + 1);
        }
    }
    return html;
}

async function renderBlocks(blocks: Block[]): Promise<string> {
    let out = "";
    for (const b of blocks) out += await renderBlock(b);
    return out;
}

// ROUTES

/* list root pages */
blogRouter.get("/", async (_req, res, next) => {
    try {
        const pages = await Promise.all(
            rootPageIds.map(async (id) => {
                const p = await NotionAPI.retrievePage(id);
                return {
                    id: p.id,
                    title: p.title,
                    iconHtml: p.icon?.emoji ?? null,
                    cover: p.cover?.external?.url || p.cover?.file?.url || null,
                    formattedLastEdited: new Date(p.last_edited_time).toLocaleString(),
                };
            })
        );
        res.json({pages});
    } catch (e) {
        next(e);
    }
});

/* single post */
blogRouter.get("/:id", async (req: Request<{ id: string }>, res, next) => {
    try {
        const page = await NotionAPI.retrievePage(req.params.id);
        const kids = await NotionAPI.getBlockChildren(page.id);
        await fetchChildrenRecursive(kids.results as Block[]);
        const html = await renderBlocks(kids.results as Block[]);

        res.json({
            pageData: {
                id: page.id,
                title: page.title,
                description: page.properties?.Description?.rich_text?.[0]?.plain_text ?? "",
                parent: page.parent,
                iconHtml: page.iconHtml,
            },
            html,
        });
    } catch (e) {
        next(e);
    }
});

blogRouter.get(
    "/media/:kind(cover|image)/:id",
    async (req: Request<{ kind: "cover" | "image"; id: string }>, res: Response, next: NextFunction) => {
        try {
            const {kind, id} = req.params;
            let url: string | undefined;

            if (kind === "cover") {
                // fresh page → pull cover object
                const page = await NotionAPI.retrievePage(id);
                const c = (page as any).cover;
                url = c?.file?.url ?? c?.external?.url;
            } else {
                // block image → pull block object
                const notionResp = await axios.get(`https://api.notion.com/v1/blocks/${id}`, {
                    headers: NotionAPI.headers(),
                });
                const blockData = notionResp.data[notionResp.data.type];
                url = blockData?.file?.url ?? blockData?.external?.url;
            }

            if (!url) {
                res.status(404).json(errorResponse(req, 404, "Image not found"));
                return;
            }

            // stream via axios
            const imageResp = await axios.get<import("stream").Readable>(url, {
                responseType: "stream",
            });

            res.setHeader("Content-Type", imageResp.headers["content-type"] || "application/octet-stream");
            imageResp.data.pipe(res);
        } catch (err) {
            next(err);
        }
    }
);

export default blogRouter;
