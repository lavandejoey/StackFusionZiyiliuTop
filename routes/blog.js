// routes/blog.js
const express = require("express");
const router = express.Router();
const katex = require('katex');
const Notion = require("../models/Notion");
const {getCommonViewOptions} = require("./utils");

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
 * @param {Object} block - A Notion block object.
 * @param {number} level - The current depth of the block in the hierarchy.
 * @param {Object} req - The Express request object.
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
            html += block.data && block.data.rich_text && block.data.rich_text.length > 0
                ? `<h1 id="${block.renderRichText().replace(/[^a-zA-Z0-9 ]/g, '').replace(/ /g, '-')}">${block.renderRichText()}</h1>`
                : `<h1></h1>`;
            break;
        case 'heading_2':
            html += block.data && block.data.rich_text && block.data.rich_text.length > 0
                ? `<h2 id="${block.renderRichText().replace(/[^a-zA-Z0-9 ]/g, '').replace(/ /g, '-')}">${block.renderRichText()}</h2>`
                : `<h2></h2>`;
            break;
        case 'heading_3':
            html += block.data && block.data.rich_text && block.data.rich_text.length > 0
                ? `<h3 id="${block.renderRichText().replace(/[^a-zA-Z0-9 ]/g, '').replace(/ /g, '-')}">${block.renderRichText()}</h3>`
                : `<h3></h3>`;
            break;
        case 'divider':
            html += `<hr />`;
            break;
        case 'quote':
            html += `<blockquote class="blockquote">${block.renderRichText()}</blockquote>`;
            break;
        case 'table_of_contents':
            html += `<div class="container toc"></div>`;
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
            // Handled as part of column_list; no individual rendering needed.
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
            // Table rows are handled within the table case.
            break;
        case "child_database": {
            const db = new Notion.Database(await Notion.NotionAPI.retrieveDatabase(block.id));
            const dbData = await Notion.NotionAPI.queryDatabase(block.id);
            html += `<div class="lead">${db.iconHtml}&nbsp;${Notion.Block.renderText(db.title)}</div>`;
            html += `<div class="table-responsive"><table class="table">`;
            html += `<thead><tr><th>Doc name</th><th>Last updated time</th><th>Created by</th></tr></thead>`;
            html += `<tbody>`;
            for (let page of dbData.results) {
                page = new Notion.Page(page);
                html += `<tr>`;
                html += `<td><a href="${req.app.locals.domain}blog?p=${page.id}">${page.iconHtml}&nbsp;${page.title}</a></td>`;
                html += `<td>${new Date(page.last_edited_time).toLocaleString()}</td>`;
                html += `<td>${page.properties["Created by"].created_by.name}</td>`;
                html += `</tr>`;
            }
            html += `</tbody></table></div>`;
        }
            break;
        case "code":
            if (block.data.language && block.data.language === "mermaid") {
                // Mermaid preview.
                html += `<div class="mermaid d-flex justify-content-center">${block.data.rich_text[0].plain_text}</div>`;
                if (block.data.caption) {
                    html += `<p class="text-center">${block.data.caption[0].plain_text}</p>`;
                }
            } else {
                // Code block with syntax highlighting and optional caption.
                html += `<figure class="highlight"><pre><code class="language-${block.data.language}">${block.data.rich_text[0].plain_text}</code></pre>`;
                if (block.data.caption) {
                    html += `<figcaption class="text-center">${block.data.caption[0].plain_text}</figcaption>`;
                }
                html += `</figure>`;
            }
            break;
        case "equation":
            // html += `<div class="text-center my-2">${block.data.expression}</div>`;
            html += `<div class="text-center my-2"><box class="katex">${katex.renderToString(block.data.expression, {
                displayMode: true,
                throwOnError: true,
                output: "mathml"
            })}</box></div>`;
            break;
        case "image":
            if (block.data.file && block.data.file.url)
                html += `<img src="${block.data.file.url}" class="img-fluid" alt="${Notion.Block.renderText(block.data.caption) || null}">`;
            break;
        default:
            html += `<p>Unknown block type: ${block.type}</p>`;
            break;
    }
    // Recursively render any child blocks if not skipped.
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
 * @param {Object} req - The Express request object.
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
            // Single page view: render a full page’s content.
            const pageId = req.query.p;
            const pageData = await Notion.NotionAPI.retrievePage(pageId);
            const blockData = await Notion.NotionAPI.getBlockChildren(pageId);
            await fetchChildBlocksRecursively(blockData.results);
            const pageContentHtml = await renderBlocks(blockData.results, req);
            res.render("blog", {
                ...getCommonViewOptions(req, res, pageData.title, pageData.description || ""),
                activePage: pageData.title,
                pageContentHtml,
                pageData,
            });
        } else {
            // Root blog view: render blog topic cards.
            const pages = await Promise.all(
                blogPageIds.map(pageId => Notion.NotionAPI.retrievePage(pageId))
            );
            res.render("blog", {
                ...getCommonViewOptions(req, res, res.__("Blog"), "Ziyi Liu's Blog"),
                activePage: "Blog",
                pages,
            });
        }
    } catch (error) {
        next(error);
    }
});

module.exports = router;
