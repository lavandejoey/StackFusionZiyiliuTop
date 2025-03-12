// routes/blog.js
const express = require("express");
const router = express.Router();
const katex = require('katex');
const Notion = require("../models/Notion");

// Define your root blog page IDs here.
const blogPageIds = [
    "1ada8db7a37b80d09d3fc14728af649c",
    "1b1a8db7a37b8197a376d0a1acffc675",
    "1ada8db7a37b807db1fbd6012ed5f837",
    // Add additional page IDs as needed.
];

/**
 * Recursively fetch child blocks for blocks that have children.
 */
async function fetchChildBlocksRecursively(blocks) {
    for (const block of blocks) {
        if (block.has_children) {
            const childrenData = await Notion.NotionAPI.getBlockChildren(block.id);
            block.children = childrenData.results;
            await fetchChildBlocksRecursively(block.children);
        }
    }
}

/**
 * Recursively render a single block to HTML.
 * @param {Block} block - A Notion block object.
 * @param level - The current depth of the block in the hierarchy.
 * @param req - The Express request object.
 * @returns {string} The rendered HTML for the block and its children.
 */
async function renderBlock(block, level = 0, req) {
    if (!block) return '';
    let html = '';
    let indent = '  '.repeat(level);
    let skipChildren = false;
    switch (block.type) {
        case 'paragraph':
            if (block.data && block.data.rich_text && block.data.rich_text.length > 0) {
                html += `<p>${indent}${block.renderRichText()}</p>`;
            } else {
                html += `<p></p>`;
            }
            break;
        case 'heading_1':
            if (block.data && block.data.rich_text && block.data.rich_text.length > 0) {
                html += `<h1>${block.renderRichText()}</h1>`;
            } else {
                html += `<h1></h1>`;
            }
            break;
        case 'heading_2':
            if (block.data && block.data.rich_text && block.data.rich_text.length > 0) {
                html += `<h2>${block.renderRichText()}</h2>`;
            } else {
                html += `<h2></h2>`;
            }
            break;
        case 'heading_3':
            if (block.data && block.data.rich_text && block.data.rich_text.length > 0) {
                html += `<h3>${block.renderRichText()}</h3>`;
            } else {
                html += `<h3></h3>`;
            }
            break;
        case 'divider':
            html += `<hr />`;
            break;
        case 'bulleted_list_item':
            if (block.data && block.data.rich_text && block.data.rich_text.length > 0) {
                const richTextHtml = block.renderRichText();
                const colorClass = block.data.color !== 'default' ? `text-${block.data.color}` : '';
                html += `<li class="${colorClass}">${richTextHtml}</li>`;
            } else {
                html += `<p></p>`;
            }
            break;
        case 'column_list':
            skipChildren = true;
            html += `<div class="row">`;
            for (const column of block.children) {
                html += `<div class="col">${await renderBlock(column, level + 1, req)}</div>`;
            }
            html += `</div>`;
            break;
        case 'column':
            break;
        case "table":
            html += `<table class="table">`;
            if (block.data.has_column_header) {
                html += `<thead><tr>`;
                for (const cell of block.children[0].data.cells) {
                    html += `<th>${Notion.Block.renderText(cell)}</th>`;
                }
                html += `</tr></thead>`;
            } else {
                html += `<tbody>`;
            }
            for (let i = block.data.has_column_header ? 1 : 0; i < block.children.length; i++) {
                html += `<tr>`;
                for (const cell of block.children[i].data.cells) {
                    html += `<td>${Notion.Block.renderText(cell)}</td>`;
                }
                html += `</tr>`;
            }
            html += `</table>`;
            break;
        case "table_row":
            break;
        case "child_database":
            const db = new Notion.Database(await Notion.NotionAPI.retrieveDatabase(block.id));
            const dbData = await Notion.NotionAPI.queryDatabase(block.id);
            // title of table(database) block.data.title
            html += `<div class="lead">${db.iconHtml}` + "&nbsp;" + `${Notion.Block.renderText(db.title)}</div>`;
            // responsive table
            html += `<div class="table-responsive"><table class="table">`;
            // ""(icon+name with link domain+/blog+?p=<page id>), Created time, Last updated time, Author (Created by)
            html += `<thead><tr><th>Doc name</th><th>Last updated time</th><th>Created by</th></tr></thead>`;
            html += `<tbody>`;
            for (let page of dbData.results) {
                page = new Notion.Page(page);
                html += `<tr>`;
                html += `<td><a href="${req.app.locals.domain}blog?p=${page.id}">${page.iconHtml}` + "&nbsp;" + `${page.title}</a></td>`;
                // html += `<td>${new Date(page.created_time).toLocaleString()}</td>`;
                html += `<td>${new Date(page.last_edited_time).toLocaleString()}</td>`;
                html += `<td>${page.properties["Created by"].created_by.name}</td>`;
                html += `</tr>`;
            }
            html += `</tbody></table></div>`;
            break;
        case "code":
            if (block.data.language && block.data.language === "mermaid") {
                // mermaid preview
                html += `<div class="mermaid d-flex justify-content-center">${block.data.rich_text[0].plain_text}</div>`;
                // caption
                if (block.data.caption) {
                    html += `<p class="text-center">${block.data.caption[0].plain_text}</p>`;
                }
            } else {
                // code block with syntax highlighting with caption
                html += `<figure class="highlight"><pre><code class="language-${block.data.language}">${block.data.rich_text[0].plain_text}</code></pre>`;
                if (block.data.caption) {
                    html += `<figcaption class="text-center">${block.data.caption[0].plain_text}</figcaption>`;
                }
                html += `</figure>`;
            }
            break;
        case "equation": // block latex
            html += `<div class="text-center my-2"><span class="katex">${katex.renderToString(block.data.expression, {
                displayMode: true,
                throwOnError: true,
                output: "mathml"
            })}</span></div>`;
            break;
        case "image":
            html += `<img src="${block.data.file.url}" class="img-fluid"  alt="${Notion.Block.renderText(block.data.caption)}">`;
            break;
        default:
            html += `<p>Unknown block type: ${block.type}</p>`;
            break;
    }
    // Recursively render any child blocks.
    if (block.children && block.children.length > 0 && !skipChildren) {
        for (const child of block.children) {
            html += await renderBlock(child, level + 1, req);
        }
    }
    return html;
}

/**
 * Render an array of blocks into a single HTML snippet.
 * @param {Array} blocks - An array of Notion block objects.
 * @param req - The Express request object.
 * @returns {string} The complete HTML snippet.
 */
async function renderBlocks(blocks, req) {
    let html = '';
    for (const block of blocks) {
        html += await renderBlock(block, 0, req);
    }
    return html;
}

router.get("/", async (req, res, next) => {
    try {
        if (req.query.p) {
            // Single page view: when a user clicks a card, p=<pageId> is provided.
            const pageId = req.query.p;
            // Retrieve the top-level blocks for the page.
            const blockData = await Notion.NotionAPI.getBlockChildren(pageId);

            // Recursively fetch children for blocks that have them.
            await fetchChildBlocksRecursively(blockData.results);

            // Render the complete HTML snippet from all blocks.
            renderBlocks(blockData.results, req).then((pageContentHtml) =>
                res.render("blog", {
                    lang: req.getLocale(),
                    activePage: "Blog",
                    pageTitle: res.__("Blog"),
                    domain: req.app.locals.domain,
                    pageContentHtml,
                    currentPage: pageId,
                })
            );
        } else {
            // Root blog view: display cards for the list of blog topic pages.
            const pages = await Promise.all(
                blogPageIds.map((pageId) => Notion.NotionAPI.retrievePage(pageId))
            );
            res.render("blog", {
                lang: req.getLocale(),
                activePage: "Blog",
                pageTitle: res.__("Blog"),
                domain: req.app.locals.domain,
                pages,
            });
        }
    } catch (error) {
        next(error);
    }
});

module.exports = router;
