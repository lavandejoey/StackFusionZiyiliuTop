// /StackFusionZiyiliuTop/backend/src/api/v1/blogRouter.ts
import {Router, Request} from "express";
import katex from "katex";
import {Block, Database, NotionAPI, Page} from "models/Notion.model";

const blogRouter = Router();

// hard-coded “root” blog pages
const blogPageIds = [
    "1ada8db7a37b80d09d3fc14728af649c",
    "1b1a8db7a37b8197a376d0a1acffc675",
    "1ada8db7a37b807db1fbd6012ed5f837",
];

/** Recursively fetches and attaches children to any block that has them. */
async function fetchChildBlocksRecursively(blocks: any[]) {
    for (const block of blocks) {
        if (block.has_children) {
            const children = await NotionAPI.getBlockChildren(block.id);
            block.children = children.results;
            await fetchChildBlocksRecursively(block.children);
        }
    }
}

/** Renders a Notion block (and its children) to an HTML string. */
async function renderBlock(block: any, level = 0): Promise<string> {
    if (!block) return "";
    let html = "";
    const indent = "  ".repeat(level);
    let skipChildren = false;

    switch (block.type) {
        case "paragraph":
            html += block.data?.rich_text?.length
                ? `<p>${indent}${block.renderRichText()}</p>`
                : `<p></p>`;
            break;

        case "heading_1":
            html += `<h1 id="${block.renderRichText()
                .replace(/[^a-zA-Z0-9 ]/g, "")
                .replace(/ /g, "-")}">${block.renderRichText()}</h1>`;
            break;

        case "heading_2":
            html += `<h2 id="${block.renderRichText()
                .replace(/[^a-zA-Z0-9 ]/g, "")
                .replace(/ /g, "-")}">${block.renderRichText()}</h2>`;
            break;

        case "heading_3":
            html += `<h3 id="${block.renderRichText()
                .replace(/[^a-zA-Z0-9 ]/g, "")
                .replace(/ /g, "-")}">${block.renderRichText()}</h3>`;
            break;

        case "divider":
            html += `<hr />`;
            break;

        case "quote":
            html += `<blockquote class="blockquote">${block.renderRichText()}</blockquote>`;
            break;

        case "table_of_contents":
            html += `<div class="container toc"></div>`;
            break;

        case "bulleted_list_item":
            const colorClass = block.data.color !== "default" ? `text-${block.data.color}` : "";
            html += `<li class="${colorClass}">${block.renderRichText()}</li>`;
            break;

        case "column_list":
            skipChildren = true;
            html += `<div class="row">`;
            for (const col of block.children) {
                html += `<div class="col">${await renderBlock(col, level + 1)}</div>`;
            }
            html += `</div>`;
            break;

        case "table":
            html += `<table class="table">`;
            // header
            if (block.data.has_column_header) {
                html += `<thead><tr>`;
                for (const cell of block.children[0].data.cells) {
                    html += `<th>${Block.renderText(cell)}</th>`;
                }
                html += `</tr></thead><tbody>`;
            } else {
                html += `<tbody>`;
            }
            // rows
            const startRow = block.data.has_column_header ? 1 : 0;
            for (let i = startRow; i < block.children.length; i++) {
                html += `<tr>`;
                for (const cell of block.children[i].data.cells) {
                    html += `<td>${Block.renderText(cell)}</td>`;
                }
                html += `</tr>`;
            }
            html += `</tbody></table>`;
            break;

        case "child_database": {
            const db = new Database(
                await NotionAPI.retrieveDatabase(block.id)
            );
            const dbData = await NotionAPI.queryDatabase(block.id);
            html += `<div class="lead">${db.iconHtml}&nbsp;${Block.renderText(db.title)}</div>`;
            html += `<div class="table-responsive"><table class="table"><thead>
                 <tr><th>Doc name</th><th>Last updated</th><th>Created by</th></tr>
               </thead><tbody>`;
            for (let page of dbData.results) {
                page = new Page(page);
                html += `<tr>
                   <td><a href="/blog/${page.id}">${page.iconHtml}&nbsp;${page.title}</a></td>
                   <td>${new Date(page.last_edited_time).toLocaleString()}</td>
                   <td>${page.properties["Created by"].created_by.name}</td>
                 </tr>`;
            }
            html += `</tbody></table></div>`;
            break;
        }

        case "code":
            if (block.data.language === "mermaid") {
                html += `<div class="mermaid d-flex justify-content-center">${block.data.rich_text[0].plain_text}</div>`;
                if (block.data.caption) {
                    html += `<p class="text-center">${block.data.caption[0].plain_text}</p>`;
                }
            } else {
                html += `<figure class="highlight">
                   <pre><code class="language-${block.data.language}">
                     ${block.data.rich_text[0].plain_text}
                   </code></pre>`;
                if (block.data.caption) {
                    html += `<figcaption class="text-center">${block.data.caption[0].plain_text}</figcaption>`;
                }
                html += `</figure>`;
            }
            break;

        case "equation":
            html += `<div class="text-center my-2">
                 <box class="katex">
                   ${katex.renderToString(block.data.expression, {
                displayMode: true,
                throwOnError: true,
                output: "mathml",
            })}
                 </box>
               </div>`;
            break;

        case "image":
            if (block.data.file?.url) {
                html += `<img src="${block.data.file.url}" class="img-fluid" alt="${Block.renderText(block.data.caption)}"/>`;
            }
            break;

        default:
            html += `<p>Unknown block type: ${block.type}</p>`;
    }

    // render children if needed
    if (!skipChildren && block.children?.length) {
        for (const child of block.children) {
            html += await renderBlock(child, level + 1);
        }
    }

    return html;
}

/** Flattens an array of blocks into one HTML string. */
async function renderBlocks(blocks: any[]): Promise<string> {
    let html = "";
    for (const block of blocks) {
        html += await renderBlock(block);
    }
    return html;
}

/** GET /api/v1/blog → list of root pages */
blogRouter.get("/", async (_req, res, next) => {
    try {
        const pages = await Promise.all(
            blogPageIds.map(async (id) => {
                const p = await NotionAPI.retrievePage(id);
                return {
                    id: p.id,
                    title: p.title,
                    iconHtml: p.iconHtml,
                    cover: p.cover?.external?.url || p.cover?.file?.url || null,
                    formattedLastEdited: new Date(p.last_edited_time).toLocaleString(),
                };
            })
        );
        res.json({pages});
    } catch (err) {
        next(err);
    }
});

/** GET /api/v1/blog/:id → single page’s metadata + rendered HTML */
blogRouter.get("/:id", async (req: Request<{ id: string }>, res, next) => {
    try {
        const {id} = req.params;
        const pageData = await NotionAPI.retrievePage(id);
        const blocks = await NotionAPI.getBlockChildren(id);
        await fetchChildBlocksRecursively(blocks.results);
        const html = await renderBlocks(blocks.results);

        res.json({
            pageData: {
                id: pageData.id,
                title: pageData.title,
                description: pageData.properties,
                parent: pageData.parent,
                iconHtml: pageData.iconHtml,
            },
            html,
        });
    } catch (err) {
        next(err);
    }
});

export default blogRouter;
