// /frontend/src/components/NotionBlocks.tsx
import React, {type JSX, useCallback, useEffect, useMemo, useState} from "react";
import {Card, Col, Row, Spinner, Table} from "react-bootstrap";
import {getChildBlocks, getDatabase, queryDatabase} from "@/services/blogService";
import {useTranslation} from 'react-i18next';
import type {
    BlockObjectResponse,
    DatabaseObjectResponse,
    PageObjectResponse,
    RichTextItemResponse,
} from "@notionhq/client/build/src/api-endpoints";
import {MathJax} from "better-react-mathjax";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faGrip, faTable} from "@fortawesome/free-solid-svg-icons";

// Helper function to render rich text blocks with proper formatting
const RichText: React.FC<{ richText: RichTextItemResponse[] }> = ({richText}) => {
    if (!richText || richText.length === 0) return null;

    return (
        <>
            {richText.map((textObject, index) => {
                const {type} = textObject;

                if (type === "equation") {
                    const {equation} = textObject;
                    return (
                        <MathJax inline key={index}>
                            {`$${equation.expression}$`}
                        </MathJax>
                    );
                } else if (type === "mention") {
                    const {mention, annotations, plain_text} = textObject;

                    // Apply styling based on annotations
                    const style: React.CSSProperties = {
                        fontWeight: annotations.bold ? "bold" : "normal",
                        fontStyle: annotations.italic ? "italic" : "normal",
                        textDecoration: [
                            annotations.underline ? "underline" : "",
                            annotations.strikethrough ? "line-through" : "",
                        ]
                            .filter(Boolean)
                            .join(" "),
                        color: annotations.code ? "#EB5757" : (annotations.color !== "default" ? annotations.color : undefined),
                        backgroundColor: annotations.code ? "#f0f0f0" : undefined,
                        padding: annotations.code ? "0.2em 0.4em" : undefined,
                        borderRadius: annotations.code ? "3px" : undefined,
                        fontFamily: annotations.code ? "monospace" : undefined,
                    };

                    // Handle page mentions - redirect to your own domain
                    if (mention.type === "page" && mention.page?.id) {
                        // Replace notion.so with your domain
                        const pageId = mention.page.id.replace(/-/g, "");
                        const href = `/blog/${pageId}`;

                        return (
                            <a key={index} href={href} style={style}>
                                {plain_text}
                            </a>
                        );
                    }

                    // Handle other mention types (user, date, etc.) - simple implementation
                    return <span key={index} style={style}>{plain_text}</span>;
                } else if (type === "text") {
                    const {
                        annotations: {bold, italic, strikethrough, underline, code, color},
                        plain_text,
                        href,
                    } = textObject;

                    const style: React.CSSProperties = {
                        fontWeight: bold ? "bold" : "normal",
                        fontStyle: italic ? "italic" : "normal",
                        textDecoration: [
                            underline ? "underline" : "",
                            strikethrough ? "line-through" : "",
                        ]
                            .filter(Boolean)
                            .join(" "),
                        color: code ? "#EB5757" : (color !== "default" ? color : undefined),
                        backgroundColor: code ? "#f0f0f0" : undefined,
                        padding: code ? "0.2em 0.4em" : undefined,
                        borderRadius: code ? "3px" : undefined,
                        fontFamily: code ? "monospace" : undefined,
                    };

                    if (href) {
                        return (
                            <a key={index} href={href} target="_blank" rel="noopener noreferrer">
                                <span style={style}>{plain_text}</span>
                            </a>
                        );
                    }

                    return (
                        <span key={index} style={style}>{plain_text}</span>
                    );
                }

                return null;
            })}
        </>
    );
};

// Helper function to create an ID from heading text for anchor links
const createHeadingId = (richText: RichTextItemResponse[]): string => {
    const text = richText.map(textObj => textObj.plain_text).join('');
    return text
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')  // Remove special characters
        .replace(/\s+/g, '-')      // Replace spaces with hyphens
        .replace(/--+/g, '-')      // Replace multiple hyphens with single hyphen
        .trim();
};

// New component for lazily loading child blocks
const AsyncChildBlocks: React.FC<{
    parentId: string;
    initiallyExpanded?: boolean;
    customClassName?: string;
}> = ({
          parentId,
          initiallyExpanded = false,
          customClassName = "ms-4 mt-2",
      }) => {
    const [childBlocks, setChildBlocks] = useState<BlockObjectResponse[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [expanded, setExpanded] = useState(initiallyExpanded);

    const loadChildren = useCallback(async () => {
        if (childBlocks.length > 0) {
            setExpanded(true);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const blocks = await getChildBlocks(parentId);
            setChildBlocks(blocks);
            setExpanded(true);
        } catch (err) {
            console.error(`Failed to load child blocks for ${parentId}:`, err);
            setError("Failed to load content");
        } finally {
            setLoading(false);
        }
    }, [childBlocks.length, parentId]);

    // Automatically attempt to load content when component mounts or when not expanded
    useEffect(() => {
        if ((initiallyExpanded || !expanded) && childBlocks.length === 0 && !loading) {
            loadChildren().catch(console.error);
        }
    }, [initiallyExpanded, expanded, childBlocks.length, loading, loadChildren]);

    // If content is already loading, show loading indicator
    if (loading) {
        return (
            <div className={customClassName}>
                <div className="d-flex align-items-center">
                    <Spinner animation="border" size="sm" className="me-2"/>
                    <span>Loading content...</span>
                </div>
            </div>
        );
    }

    // If there was an error loading content, show error with retry option
    if (error) {
        return (
            <div className={customClassName}>
                <div className="text-danger">
                    {error}
                    <button
                        className="btn btn-sm btn-link"
                        onClick={() => {
                            loadChildren().catch(err => {
                                console.error(`Failed to retry loading children for ${parentId}:`, err);
                            });
                        }}
                    >
                        Try again
                    </button>
                </div>
            </div>
        );
    }

    // If no content available after loading
    if (childBlocks.length === 0) {
        return (
            <div className={customClassName}>
                <p className="text-muted">No content available</p>
            </div>
        );
    }

    // If we have content, and we're expanded, show the content
    if (expanded) {
        return (
            <div className={customClassName}>
                <NotionBlocks blocks={childBlocks}/>
            </div>
        );
    }

    // If not expanded and not already loading, trigger loading
    return null;
};

// Individual block rendering components
const Paragraph: React.FC<{ block: BlockObjectResponse }> = ({block}) => {
    if (block.type !== "paragraph") return null;
    return (
        <p className="mb-1">
            <RichText richText={block.paragraph.rich_text}/>
        </p>
    );
};

const Heading1: React.FC<{ block: BlockObjectResponse }> = ({block}) => {
    if (block.type !== "heading_1") return null;
    const id = createHeadingId(block.heading_1.rich_text);
    return (
        <h1 id={id} className="mt-4 mb-2">
            <RichText richText={block.heading_1.rich_text}/>
        </h1>
    );
};

const Heading2: React.FC<{ block: BlockObjectResponse }> = ({block}) => {
    if (block.type !== "heading_2") return null;
    const id = createHeadingId(block.heading_2.rich_text);
    return (
        <h2 id={id} className="mt-4 mb-2">
            <RichText richText={block.heading_2.rich_text}/>
        </h2>
    );
};

const Heading3: React.FC<{ block: BlockObjectResponse }> = ({block}) => {
    if (block.type !== "heading_3") return null;
    const id = createHeadingId(block.heading_3.rich_text);
    return (
        <h3 id={id} className="mt-3 mb-2">
            <RichText richText={block.heading_3.rich_text}/>
        </h3>
    );
};

const BulletedListItem: React.FC<{ block: BlockObjectResponse }> = ({block}) => {
    if (block.type !== "bulleted_list_item") return null;
    return (
        <li>
            <RichText richText={block.bulleted_list_item.rich_text}/>
            {block.has_children && (
                <AsyncChildBlocks parentId={block.id}/>
            )}
        </li>
    );
};

const NumberedListItem: React.FC<{ block: BlockObjectResponse }> = ({block}) => {
    if (block.type !== "numbered_list_item") return null;
    return (
        <li>
            <RichText richText={block.numbered_list_item.rich_text}/>
            {block.has_children && (
                <AsyncChildBlocks parentId={block.id}/>
            )}
        </li>
    );
};

const TodoItem: React.FC<{ block: BlockObjectResponse }> = ({block}) => {
    if (block.type !== "to_do") return null;
    return (
        <div className="d-flex align-items-center mb-2">
            <input
                type="checkbox"
                defaultChecked={block.to_do.checked}
                readOnly
                className="me-2"
            />
            <span>
<RichText richText={block.to_do.rich_text}/>
</span>
        </div>
    );
};

const Toggle: React.FC<{ block: BlockObjectResponse }> = ({block}) => {
    if (block.type !== "toggle") return null;

    return (
        <details className="mb-3">
            <summary className="fw-bold">
                <RichText richText={block.toggle.rich_text}/>
            </summary>
            {block.has_children && (
                <AsyncChildBlocks parentId={block.id}/>
            )}
        </details>
    );
};

const Code: React.FC<{ block: BlockObjectResponse }> = ({block}) => {
    // always define state
    const [copied, setCopied] = useState(false);

    // compute even before any returns, so hooks all stay in order
    const codeText =
        block.type === "code"
            ? block.code.rich_text.map((t) => t.plain_text).join("")
            : "";
    const language =
        block.type === "code"
            ? block.code.language?.toLowerCase() || ""
            : "";
    const isMermaid = language === "mermaid";

    // Function to handle copying code to clipboard
    const handleCopyClick = () => {
        navigator.clipboard.writeText(codeText)
            .then(() => setCopied(true))
            .catch(err => console.error("Failed to copy code:", err));
    };

    // reset "Copied!" banner
    useEffect(() => {
        if (!copied) return;
        const id = setTimeout(() => setCopied(false), 2000);
        return () => clearTimeout(id);
    }, [copied]);

    // initialize Mermaid if needed - combined into a single useEffect
    useEffect(() => {
        if (!isMermaid || block.type !== "code") return;

        import("mermaid")
            .then((m) => {
                m.default.initialize({
                    startOnLoad: true,
                    theme: "neutral",
                    securityLevel: "loose",
                    fontFamily: "inherit",
                });
                try {
                    m.default.contentLoaded();
                } catch (e) {
                    console.error("Mermaid rendering error:", e);
                }
            })
            .catch(console.error);
    }, [isMermaid, block.type]);

    // now safe to bail if not a code block
    if (block.type !== "code") return null;

    // Render Mermaid diagram
    if (isMermaid) {
        return (
            <div className="mb-4">
                <div className="bg-light p-0 rounded position-relative">
                    <div className="d-flex justify-content-between align-items-center p-2 border-bottom">
                        <small className="text-muted">mermaid</small>
                        <button
                            className="btn btn-sm btn-outline-secondary"
                            onClick={handleCopyClick}
                            aria-label="Copy code"
                            title="Copy to clipboard"
                        >
                            {copied ?
                                <><i className="bi bi-check-lg"></i> Copied!</> :
                                <><i className="bi bi-clipboard"></i> Copy</>
                            }
                        </button>
                    </div>
                    <div className="mermaid p-3 text-center">
                        {codeText}
                    </div>
                </div>
            </div>
        );
    }


    // Render regular code block with copy button
    return (
        <div className="mb-4">
            <div className="bg-light rounded position-relative">
                <div className="d-flex justify-content-between align-items-center p-2 border-bottom">
                    <small className="text-muted">{language || "code"}</small>
                    <button
                        className="btn btn-sm btn-outline-secondary"
                        onClick={handleCopyClick}
                        aria-label="Copy code"
                        title="Copy to clipboard"
                    >
                        {copied ?
                            <><i className="bi bi-check-lg"></i> Copied!</> :
                            <><i className="bi bi-clipboard"></i> Copy</>
                        }
                    </button>
                </div>
                <pre className="p-3 m-0">
                    <code>{codeText}</code>
                </pre>
            </div>
        </div>
    );
};

const Quote: React.FC<{ block: BlockObjectResponse }> = ({block}) => {
    if (block.type !== "quote") return null;
    return (
        <blockquote className="border-start border-3 ps-3 mb-4 fst-italic">
            <RichText richText={block.quote.rich_text}/>
        </blockquote>
    );
};

const Callout: React.FC<{ block: BlockObjectResponse }> = ({block}) => {
    if (block.type !== "callout") return null;
    return (
        <div className="bg-light p-3 rounded d-flex mb-4">
            <div className="me-2">
                {block.callout.icon?.type === "emoji" ? block.callout.icon.emoji : "💡"}
            </div>
            <div>
                <RichText richText={block.callout.rich_text}/>
            </div>
        </div>
    );
};

const Divider: React.FC<{ block: BlockObjectResponse }> = ({block}) => {
    if (block.type !== "divider") return null;
    return <hr className="my-4"/>;
};

const Image: React.FC<{ block: BlockObjectResponse }> = ({block}) => {
    if (block.type !== "image") return null;

    const imageUrl =
        block.image.type === "external"
            ? block.image.external.url
            : block.image.file.url;

    const caption = block.image.caption.length > 0
        ? block.image.caption.map(c => c.plain_text).join("")
        : "";

    return (
        <figure className="text-center mb-4">
            <img
                src={imageUrl}
                alt={caption || "Image"}
                className="img-fluid rounded"
                style={{maxHeight: "500px"}}
            />
            {caption && (
                <figcaption className="text-muted mt-2">{caption}</figcaption>
            )}
        </figure>
    );
};

const ChildIcon: React.FC<{ block: BlockObjectResponse }> = ({block}) => {
    if (block.type !== "child_database") return null;
    // TODO
    // Return a database icon
    return (
        <i className="bi bi-table"></i>
    );
}

// Table of Contents component
interface TOCItem {
    id: string;
    text: string;
    level: number;
}

// Table of Contents component with fixed positioning and vertical centering
export const TableOfContents: React.FC<{ blocks: BlockObjectResponse[], title?: string }> = ({blocks, title}) => {
    const [activeId, setActiveId] = useState<string | null>(null);
    const [scrollPosition, setScrollPosition] = useState(0);
// Add offset value to account for the fixed border frame
    const scrollOffset = 40; // Adjust this value based on your border thickness

// Extract headings from blocks
    const headings: TOCItem[] = useMemo(() => {
        return blocks
            .filter(block => ["heading_1", "heading_2", "heading_3"].includes(block.type))
            .map(block => {
                const type = block.type as "heading_1" | "heading_2" | "heading_3";
                const level = parseInt(type.split('_')[1]);

// Type-safe access to rich_text based on heading type
                let richText: RichTextItemResponse[] = [];
                if (type === "heading_1" && "heading_1" in block) {
                    richText = block.heading_1.rich_text;
                } else if (type === "heading_2" && "heading_2" in block) {
                    richText = block.heading_2.rich_text;
                } else if (type === "heading_3" && "heading_3" in block) {
                    richText = block.heading_3.rich_text;
                }

                const id = createHeadingId(richText);
                const text = richText.map((t: { plain_text: string }) => t.plain_text).join('');

                return {id, text, level};
            });
    }, [blocks]);

// Track scroll position to apply vertical centering
    useEffect(() => {
        const handleScroll = () => {
            setScrollPosition(window.scrollY);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

// Handle intersection observer to highlight active section
    useEffect(() => {
        if (typeof window === 'undefined' || !headings.length) return;

        const observer = new IntersectionObserver(
            entries => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        setActiveId(entry.target.id);
                    }
                });
            },
            {
// Adjust the rootMargin to account for the fixed border frame
// Format: "top right bottom left"
                rootMargin: `-${scrollOffset}px 0px -80% 0px`,
                threshold: 0.1
            }
        );

// Observe all heading elements
        headings.forEach(heading => {
            const element = document.getElementById(heading.id);
            if (element) observer.observe(element);
        });

        return () => {
            headings.forEach(heading => {
                const element = document.getElementById(heading.id);
                if (element) observer.unobserve(element);
            });
        };
    }, [headings, scrollOffset]);

    if (!headings.length) {
        return null;
    }

// Calculate the vertical positioning for the TOC
// When user scrolls down more than 300px, we start vertically centering the TOC
    const shouldCenter = scrollPosition > 200;

    return (
        <nav className="table-of-contents" style={{
            position: 'sticky',
            top: shouldCenter ? '50%' : '2rem',
            transform: shouldCenter ? 'translateY(-50%)' : 'none',
            maxHeight: shouldCenter ? '80vh' : 'calc(100vh - 4rem)',
            overflowY: 'auto',
            padding: '1rem',
            borderLeft: '1px solid #dee2e6',
            transition: 'top 0.3s ease, transform 0.3s ease',
        }}>
            <h5 className="mb-3">{title}</h5>
            <ul className="list-unstyled">
                {headings.map((heading) => (
                    <li
                        key={heading.id}
                        className="mb-2"
                        style={{
                            paddingLeft: `${(heading.level - 1) * 0.75}rem`,
                            fontSize: `${0.95 - (heading.level - 1) * 0.05}rem`,
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <a
                            href={`#${heading.id}`}
                            className={`text-decoration-none ${activeId === heading.id ? 'fw-bold text-primary' : 'text-secondary'}`}
                            onClick={(e) => {
                                e.preventDefault();
                                const element = document.getElementById(heading.id);
                                if (element) {
                                    // Get the element's position relative to the document
                                    const elementPosition = element.getBoundingClientRect().top + window.scrollY;
                                    // Scroll to the element with the offset adjustment
                                    window.scrollTo({
                                        top: elementPosition - scrollOffset,
                                        behavior: 'smooth'
                                    });
                                    window.history.pushState(null, '', `#${heading.id}`);
                                    setActiveId(heading.id);
                                }
                            }}
                        >
                            {heading.text}
                        </a>
                    </li>
                ))}
            </ul>
        </nav>
    );
};

// Add a new component for table_of_contents block type
const TableOfContentsBlock: React.FC<{
    block: BlockObjectResponse;
    allBlocks: BlockObjectResponse[];
}> = ({block, allBlocks}) => {
    if (block.type !== "table_of_contents") return null;

    return (
        <div className="toc-container d-lg-none">
            <TableOfContents blocks={allBlocks}/>
        </div>
    );
};

// Special component to handle both list types
const ListWrapper: React.FC<{
    blocks: BlockObjectResponse[];
    startIndex: number;
}> = ({blocks, startIndex}) => {
    const listType = blocks[startIndex].type;
    const endIndex = blocks.findIndex(
        (block, idx) => idx > startIndex && block.type !== listType
    );

    const listItems = blocks.slice(
        startIndex,
        endIndex === -1 ? blocks.length : endIndex
    );

    if (listType === "bulleted_list_item") {
        return (
            <ul className="mb-4">
                {listItems.map((block) => (
                    <BulletedListItem key={block.id} block={block}/>
                ))}
            </ul>
        );
    } else if (listType === "numbered_list_item") {
        return (
            <ol className="mb-4">
                {listItems.map((block) => (
                    <NumberedListItem key={block.id} block={block}/>
                ))}
            </ol>
        );
    }

    return null;
};

// Special component for equation blocks
const Equation: React.FC<{ block: BlockObjectResponse }> = ({block}) => {
    if (block.type !== "equation") return null;
    return (
        <>
            <style>{`
                .mathjax-wrapper {
                    overflow-x: auto;
                    overflow-y: hidden;
                    max-width: 95%;
                    display: block;
                    scrollbar-width: thin;
                    scrollbar-color: var(--bs-border-color) transparent;
                }

                /* Left/right shadow indicators */
                .mathjax-wrapper::before,
                .mathjax-wrapper::after {
                    content: "";
                    position: absolute;
                    top: 0;
                    bottom: 0;
                    width: 1.5rem;
                    pointer-events: none;
                    transition: opacity 0.2s ease;
                }

                .mathjax-wrapper::before {
                    left: 0;
                    background: linear-gradient(to right, rgba(0, 0, 0, 0.08), transparent);
                    opacity: 0;
                }

                .mathjax-wrapper::after {
                    right: 0;
                    background: linear-gradient(to left, rgba(0, 0, 0, 0.08), transparent);
                    opacity: 0;
                }
            `}</style>
            <div className="my-1 text-center position-relative mathjax-wrapper">
                <MathJax>{`$$${block.equation.expression}$$`}</MathJax>
            </div>
        </>
    );
};

// Special component for column lists and columns
const ColumnList: React.FC<{ block: BlockObjectResponse }> = ({block}) => {
// always run these hooks
    const [columnBlocks, setColumnBlocks] = useState<BlockObjectResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (block.type !== "column_list") return;
        let mounted = true;
        (async () => {
            try {
                const children = await getChildBlocks(block.id);
                if (!mounted) return;
                setColumnBlocks(children.filter((b) => b.type === "column"));
            } catch (e) {
                console.error(`Failed to fetch columns for ${block.id}`, e);
                if (mounted) setError("Failed to load columns");
            } finally {
                if (mounted) setLoading(false);
            }
        })();
        return () => {
            mounted = false;
        };
    }, [block.id, block.type]);

    if (block.type !== "column_list") return null;

    if (loading) {
        return <div className="d-flex justify-content-center my-4"><Spinner animation="border"/></div>;
    }

    if (error) {
        return (
            <div className="alert alert-warning">
                {error}
                <button
                    className="btn btn-sm btn-link ms-2"
                    onClick={() => {
                        setLoading(true);
                    }}
                >
                    Retry
                </button>
            </div>
        );
    }

    if (columnBlocks.length === 0) {
        return <div className="text-muted my-3">No columns available</div>;
    }

    return (
        <Row className="column-list mb-4">
            {columnBlocks.map((columnBlock) => (
                <Col
                    key={columnBlock.id}
                    xs={12}
                    md={getColumnWidth(columnBlock, columnBlocks.length)}
                    className="mb-3 mb-md-0"
                >
                    <Column block={columnBlock}/>
                </Col>
            ))}
        </Row>
    );
};

// Helper function to calculate column width based on width_ratio if available
const getColumnWidth = (columnBlock: BlockObjectResponse, totalColumns: number): number => {
    // Default calculation: evenly distribute columns with min width of 3/12 (25%)
    const defaultColWidth = Math.max(12 / totalColumns, 3);

    // Check if column has width_ratio
    if (columnBlock.type === "column" && columnBlock.column && 'width_ratio' in columnBlock.column) {
        // Convert ratio to Bootstrap column units (out of 12)
        const widthRatio = columnBlock.column.width_ratio as number;
        return Math.round(widthRatio * 12);
    }

    return defaultColWidth;
};

const Column: React.FC<{ block: BlockObjectResponse, }> = ({block}) => {
    if (block.type !== "column") return null;

    return (
        <>
            {block.has_children ? (
                <AsyncChildBlocks parentId={block.id} initiallyExpanded={true} customClassName="p-0"/>
            ) : (
                <div style={{minHeight: "50px", color: "#ccc", textAlign: "center"}}>
                    Empty column
                </div>
            )}
        </>
    );
};

// Special component for tables
const TableBlock: React.FC<{ block: BlockObjectResponse }> = ({block}) => {
// hooks always run
    const [tableRows, setTableRows] = useState<BlockObjectResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (block.type !== "table") return;
        let mounted = true;
        (async () => {
            try {
                const ch = await getChildBlocks(block.id);
                if (mounted) setTableRows(ch.filter((b) => b.type === "table_row"));
            } catch (e) {
                console.error(`Failed to fetch rows for ${block.id}`, e);
                if (mounted) setError("Failed to load table content");
            } finally {
                if (mounted) setLoading(false);
            }
        })();
        return () => {
            mounted = false;
        };
    }, [block.id, block.type]);

    if (block.type !== "table") return null;

// Table header properties
    const hasColumnHeader = block.table.has_column_header;
    const hasRowHeader = block.table.has_row_header;

    if (loading) {
        return (
            <div className="my-4 text-center">
                <Spinner animation="border" role="status"/>
                <span className="ms-2">Loading table...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="alert alert-warning my-3">
                {error}
                <button
                    className="btn btn-sm btn-link ms-2"
                    onClick={() => {
                        setLoading(true);
                    }}
                >
                    Retry
                </button>
            </div>
        );
    }

    if (tableRows.length === 0) {
        return <div className="text-muted my-3">Empty table</div>;
    }

// Determine table styling based on content
    const tableStyles = {
// Use striped for better readability
        className: "table table-bordered table-striped table-responsive-md",
// Make the table fill its container width but respect content
        style: {width: "100%", minWidth: "50%", maxWidth: "100%"}
    };

// Apply different hover effects based on if the table has headers
    if (hasColumnHeader || hasRowHeader) {
        tableStyles.className += " table-hover";
    }

    return (
        <div className="table-responsive-md mb-4">
            <table {...tableStyles}>
                {hasColumnHeader && tableRows.length > 0 && (
                    <thead className="table-light">
                    <TableRow
                        block={tableRows[0]}
                        isHeader={true}
                        hasRowHeader={hasRowHeader}
                    />
                    </thead>
                )}
                <tbody>
                {tableRows
                    .slice(hasColumnHeader ? 1 : 0)
                    .map((rowBlock) => (
                        <TableRow
                            key={rowBlock.id}
                            block={rowBlock}
                            isHeader={false}
                            hasRowHeader={hasRowHeader}
                        />
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const TableRow: React.FC<{
    block: BlockObjectResponse;
    isHeader: boolean;
    hasRowHeader?: boolean;
}> = ({block, isHeader, hasRowHeader = false}) => {
    if (block.type !== "table_row") return null;

    return (
        <tr>
            {block.table_row.cells.map((cell, cellIndex) => {
                const isHeaderCell = isHeader || (hasRowHeader && cellIndex === 0);
                const CellTag = isHeaderCell ? "th" : "td";
                const scope = isHeader ? "col" : (hasRowHeader && cellIndex === 0 ? "row" : undefined);

                return (
                    <CellTag
                        key={`${block.id}-cell-${cellIndex}`}
                        scope={scope}
                        className={isHeaderCell ? "table-active" : ""}
                    >
                        {cell.map((textObj, textIndex) => (
                            <RichText
                                key={`${block.id}-cell-${cellIndex}-text-${textIndex}`}
                                richText={[textObj]}
                            />
                        ))}
                    </CellTag>
                );
            })}
        </tr>
    );
};

// Special component for link previews
const LinkPreview: React.FC<{ block: BlockObjectResponse }> = ({block}) => {
    if (block.type !== 'link_preview') return null

    const {url} = block.link_preview
    if (!url) return null

    const domain = new URL(url).hostname.replace(/^www\./, '').toUpperCase()
    const faviconUrl = `https://www.google.com/s2/favicons?domain=${url}`

    return (
        <Card
            as="a"
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="mb-3 text-decoration-none"
        >
            <Card.Body className="p-2">
                <Row className="align-items-center mb-1">
                    <Col xs="auto" className="d-flex align-items-center">
                        <img
                            src={faviconUrl}
                            alt={`${domain} favicon`}
                            width={16}
                            height={16}
                        />
                        <span className="ms-2 text-primary">{domain}</span>
                    </Col>
                </Row>
                <Row>
                    <Col>
                        <small className="text-truncate text-muted d-block">
                            {url}
                        </small>
                    </Col>
                </Row>
            </Card.Body>
        </Card>
    )
};

// Special component for child_database blocks
const ChildDatabase: React.FC<{ block: BlockObjectResponse }> = ({block}) => {
    const [database, setDatabase] = useState<DatabaseObjectResponse | null>(null);
    const [entries, setEntries] = useState<PageObjectResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [viewType, setViewType] = useState<'table' | 'gallery' | 'list'>('table');
    const {i18n} = useTranslation();

    // CSS styles as an object for inline styling
    const styles = {
        container: {
            borderRadius: '8px',
            border: '1px solid #e0e0e0',
            padding: '1rem',
            background: '#fff',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
            marginBottom: '1rem',
        },
        title: {
            fontSize: '1.4rem',
            fontWeight: 600,
            marginBottom: '1rem',
        },
        tableContainer: {
            overflowX: 'auto' as const,
        },
        table: {
            width: '100%',
            borderCollapse: 'collapse' as const,
        },
        tableHeader: {
            display: 'flex',
            fontWeight: 'bold',
            backgroundColor: '#f8f9fa',
            borderBottom: '2px solid #dee2e6',
        },
        tableRow: {
            display: 'flex',
            borderBottom: '1px solid #e0e0e0',
            textDecoration: 'none',
            color: 'inherit',
            transition: 'background-color 0.2s',
        },
        tableCell: {
            padding: '12px 16px',
            flex: 1,
            minWidth: '150px',
            wordBreak: 'break-word' as const,
        },
        gallery: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
            gridGap: '16px',
        },
        galleryCard: {
            border: '1px solid #e0e0e0',
            borderRadius: '5px',
            overflow: 'hidden',
            textDecoration: 'none',
            color: 'inherit',
            transition: 'transform 0.2s, box-shadow 0.2s',
        },
        galleryImage: {
            height: '150px',
            overflow: 'hidden',
        },
        galleryImageContent: {
            width: '100%',
            height: '100%',
            objectFit: 'cover' as const,
        },
        galleryContent: {
            padding: '16px',
        },
        list: {
            display: 'flex',
            flexDirection: 'column' as const,
        },
        listItem: {
            padding: '12px 16px',
            borderBottom: '1px solid #e0e0e0',
            textDecoration: 'none',
            color: 'inherit',
            transition: 'background-color 0.2s',
        },
    };

    // Extract database ID from block ID
    // In Notion, child_database blocks point to a linked database
    const databaseId = useMemo(() => {
        // The ID is essentially the block ID, but we need to extract the UUID part
        return block.id.replace(/-/g, '');
    }, [block.id]);

    // Add CSS for hover effects since we can't easily do that inline
    useEffect(() => {
        const style = document.createElement('style');
        style.innerHTML = `
            .db-table-row:hover {
                background-color: #f8f8f8;
            }
            .db-gallery-card:hover {
                transform: translateY(-3px);
                box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
            }
            .db-list-item:hover {
                background-color: #f8f8f8;
            }
        `;
        document.head.appendChild(style);

        return () => {
            document.head.removeChild(style);
        };
    }, []);

    // Fetch database metadata and entries
    useEffect(() => {
        let mounted = true;

        const fetchDatabaseData = async () => {
            setLoading(true);
            setError(null);

            try {
                // First, fetch database metadata to get column information
                const databaseData = await getDatabase(databaseId);

                if (!mounted) return;
                setDatabase(databaseData);

                // Look for a ranking property (Rank, Order, Sort Order, etc.)
                const rankProperty = Object.entries(databaseData.properties).find(
                    ([name, prop]) =>
                        prop.type === 'number' &&
                        (name.toLowerCase() === 'rank' ||
                            name.toLowerCase() === 'order' ||
                            name.toLowerCase() === 'sort order' ||
                            name.toLowerCase() === 'sort')
                );

                // Build sorts array - prioritize manual ranking if available
                const sorts = rankProperty
                    ? [{property: rankProperty[0], direction: 'ascending'}]
                    : [{timestamp: 'created_time', direction: 'ascending'}];

                // Then query database entries with sorting
                const entriesData = await queryDatabase(databaseId, {sorts});

                if (!mounted) return;
                setEntries(entriesData.results);
            } catch (err) {
                console.error(`Failed to fetch database ${databaseId}:`, err);
                if (mounted) setError("Failed to load database content");
            } finally {
                if (mounted) setLoading(false);
            }
        };

        fetchDatabaseData().catch(console.error);

        return () => {
            mounted = false;
        };
    }, [databaseId]);

    if (block.type !== "child_database") return null;

    // Extract property values in a readable format
    const extractPropertyValue = (page: PageObjectResponse, propertyId: string) => {
        const property = page.properties[propertyId];
        if (!property) return null;

        switch (property.type) {
            case 'title':
                return property.title.map(t => t.plain_text).join('');
            case 'rich_text':
                return property.rich_text.map(t => t.plain_text).join('');
            case 'select':
                return property.select?.name || null;
            case 'multi_select':
                return property.multi_select.map(s => s.name).join(', ');
            case 'date':
                return property.date?.start || null;
            case "created_by":
                return "name" in property.created_by ? property.created_by.name : null;
            case "created_time":
                return property.created_time
                    ? new Date(property.created_time)
                        .toLocaleDateString(i18n.language, {year: 'numeric', month: 'long', day: '2-digit'})
                    : null;
            case "last_edited_by":
                return "name" in property.last_edited_by ? property.last_edited_by.name : null;
            case "last_edited_time":
                return property.last_edited_time
                    ? new Date(property.last_edited_time)
                        .toLocaleDateString(i18n.language, {year: 'numeric', month: 'long', day: '2-digit'})
                    : null;
            case 'checkbox':
                return property.checkbox ? '✓' : '✗';
            case 'url':
                return property.url;
            case 'email':
                return property.email;
            case 'phone_number':
                return property.phone_number;
            case 'number':
                return property.number !== null ? property.number.toString() : null;
            case 'status':
                return property.status?.name || null;
            case 'people':
                // Fix TypeScript error by safely checking if name exists
                // The UserObjectResponse has a name property but PartialUserObjectResponse doesn't
                return property.people.map(p => {
                    // Check if it's a full user object with the name property
                    if ('name' in p) {
                        return p.name;
                    }
                    // Fall back to ID for partial user objects
                    return p.id;
                }).join(', ');
            default:
                return 'Unsupported property type';
        }
    };

    // Format display name for a property (column)
    const getPropertyDisplayName = (propertyId: string) => {
        if (!database || !database.properties[propertyId]) return propertyId;
        return database.properties[propertyId].name;
    };

    // Get primary column for each entry (usually the title)
    const getPrimaryProperty = (entry: PageObjectResponse) => {
        if (!database) return null;
        const titlePropId = Object.keys(database.properties).find(
            key => database.properties[key].type === 'title'
        );
        return titlePropId ? extractPropertyValue(entry, titlePropId) : null;
    };

    // Get URL for a page
    const getPageUrl = (page: PageObjectResponse) => {
        return `/blog/${page.id.replace(/-/g, '')}`;
    };

    const renderTableView = () => {
        if (!database || entries.length === 0) return <div>No items to display</div>;

        // Determine which columns to display
        const visibleColumns = Object.entries(database.properties)
            .filter(([, prop]) => !['files', 'formula', 'rollup'].includes(prop.type))
            .map(([id]) => id);

        // Order: primary (title) first, metadata last
        const primaryPropId = Object.entries(database.properties)
            .find(([, prop]) => prop.type === 'title')?.[0];
        const metaTypes = ['created_by', 'created_time', 'last_edited_by', 'last_edited_time'];
        const otherColumns = visibleColumns.filter(
            id => id !== primaryPropId && !metaTypes.includes(database.properties[id].type)
        );
        const metaColumns = visibleColumns.filter(
            id => metaTypes.includes(database.properties[id].type)
        );
        const orderedColumns = [
            ...(primaryPropId && visibleColumns.includes(primaryPropId) ? [primaryPropId] : []),
            ...otherColumns,
            ...metaColumns,
        ];

        return (
            <Table responsive size="sm" className="m-auto db-table">
                <thead>
                <tr>
                    {orderedColumns.map(propId => (
                        <th key={propId} className="text-nowrap">
                            {getPropertyDisplayName(propId)}
                        </th>
                    ))}
                </tr>
                </thead>
                <tbody>
                {entries.map(entry => (
                    <tr
                        key={entry.id}
                        className="db-table-row"
                        onClick={() => (window.location.href = getPageUrl(entry))}
                        style={{cursor: 'pointer'}}
                    >
                        {orderedColumns.map(propId => (
                            <td key={propId} className="text-nowrap">
                                {extractPropertyValue(entry, propId)}
                            </td>
                        ))}
                    </tr>
                ))}
                </tbody>
                <style type="text/css">{`
/* Base table: no heavy borders, neutral bg */
.db-table {
  background: var(--bs-body-bg);
  border-collapse: separate;        /* needed for clean thin rules */
  border-spacing: 0;                /* no gaps */
  --db-grid: var(--bs-border-color-translucent, rgba(0,0,0,.08));
}

/* Header: subtle bottom rule, no fill */
.db-table thead th {
  font-weight: 600;
  background: transparent;
  color: var(--bs-body-color);
  border: 0;
  border-bottom: 1px solid var(--db-grid);
  padding-top: .40rem;
  padding-bottom: .55rem;
  white-space: nowrap;
}

/* Cells: only hairline row separators + light vertical dividers */
.db-table tbody td {
  border: 0;
  border-bottom: 1px solid var(--db-grid);
  padding-top: .55rem;
  padding-bottom: .5rem;
  vertical-align: middle;
}

/* Vertical dividers: thinner and subtle */
.db-table thead th,
.db-table tbody td {
  border-right: 1px solid var(--db-grid);
}
.db-table thead th:last-child,
.db-table tbody td:last-child {
  border-right: 0;
}

/* Row hover: very soft */
.db-table tbody tr:hover td {
  background: var(--bs-secondary-bg-subtle, rgba(var(--bs-secondary-rgb, 108,117,125), .06));
}

/* Remove outer frame look */
.db-table > :not(caption) > * > * {
  box-shadow: none;   /* cancels Bootstrap table group shadows if any */
}

/* Tighten typography a touch for that Notion-like feel */
.db-table {
  font-size: .95rem;
  line-height: 1.25rem;
}
`}</style>
            </Table>
        );
    };

    const renderGalleryView = () => {
        if (!database || entries.length === 0) return <div>No items to display</div>;

        return (
            <div style={styles.gallery}>
                {entries.map(entry => (
                    <a
                        key={entry.id}
                        href={getPageUrl(entry)}
                        style={styles.galleryCard}
                        className="db-gallery-card"
                    >
                        {entry.cover && (
                            <div style={styles.galleryImage}>
                                <img
                                    src={entry.cover.type === 'external'
                                        ? entry.cover.external.url
                                        : entry.cover.file?.url}
                                    alt={getPrimaryProperty(entry) || 'Database item'}
                                    style={styles.galleryImageContent}
                                />
                            </div>
                        )}
                        <div style={styles.galleryContent}>
                            <h4>{getPrimaryProperty(entry)}</h4>
                        </div>
                    </a>
                ))}
            </div>
        );
    };

    if (loading) {
        return (
            <Card className="mb-4">
                <Card.Header className="d-flex align-items-center">
                    <i className="bi bi-table me-2"></i>
                    <strong>{block.child_database.title}</strong>
                </Card.Header>
                <Card.Body className="text-center py-5">
                    <Spinner animation="border" role="status"/>
                    <p className="mt-2">Loading database...</p>
                </Card.Body>
            </Card>
        );
    }

    if (error) {
        return (
            <Card className="mb-4">
                <Card.Header className="d-flex align-items-center">
                    <i className="bi bi-table me-2"></i>
                    <strong>{block.child_database.title}</strong>
                </Card.Header>
                <Card.Body>
                    <div className="alert alert-warning">
                        {error}
                        <button
                            className="btn btn-sm btn-link"
                            onClick={() => setLoading(true)}
                        >
                            Retry
                        </button>
                    </div>
                </Card.Body>
            </Card>
        );
    }

    return (
        <div style={styles.container}>
            <div className="database-header">
                <div className="d-flex flex-wrap align-items-center gap-2">
                    <div className="d-flex align-items-center flex-grow-1 overflow-hidden">
                        <h3 className="h5 mb-0 text-truncate d-flex align-items-center">
                            <ChildIcon block={block}/>
                            <span className="ms-2"><p className="lead m-auto">{block.child_database.title}</p>                                </span>
                        </h3>
                    </div>

                    <div className="ms-auto">
                        {/* track */}
                        <div className="d-inline-flex bg-body-tertiary rounded-pill p-1 gap-1" role="group"
                             aria-label="View type">
                            {/* table */}
                            <button
                                type="button"
                                aria-pressed={viewType === 'table'}
                                aria-label="Table view"
                                className={[
                                    'border-0 rounded-2 px-3 py-2 d-inline-flex align-items-center justify-content-center',
                                    viewType === 'table'
                                        ? 'bg-primary text-white'
                                        : 'bg-transparent text-body'
                                ].join(' ')}
                                onClick={() => setViewType('table')}
                            >
                                <FontAwesomeIcon icon={faTable}/>
                            </button>

                            {/* gallery */}
                            <button
                                type="button"
                                aria-pressed={viewType === 'gallery'}
                                aria-label="Gallery view"
                                className={[
                                    'border-0 rounded-2 px-3 py-2 d-inline-flex align-items-center justify-content-center',
                                    viewType === 'gallery'
                                        ? 'bg-primary text-white'
                                        : 'bg-transparent text-body'
                                ].join(' ')}
                                onClick={() => setViewType('gallery')}
                            >
                                <FontAwesomeIcon icon={faGrip}/>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="database-content">
                {viewType === 'table' && renderTableView()}
                {viewType === 'gallery' && renderGalleryView()}
            </div>
        </div>
    );
};

// Main component to render blocks
export const NotionBlocks: React.FC<{ blocks: BlockObjectResponse[] }> = ({blocks}) => {
    if (!blocks || blocks.length === 0) {
        return <p>No content available.</p>;
    }

// Filter out blocks that will be rendered within columns to prevent duplicate rendering
    const shouldRender = (block: BlockObjectResponse): boolean => {
// Don't render blocks that are direct children of columns in the main flow
        if (block.parent?.type === "block_id") {
// Now TypeScript knows parent has a block_id property
            const parentBlockId = block.parent.block_id;
            const parentBlock = blocks.find(b => b.id === parentBlockId);
            if (parentBlock && parentBlock.type === "column") {
                return false;
            }
        }
        return true;
    };

// Apply the filter to blocks
    const topLevelBlocks = blocks.filter(shouldRender);

    const renderedBlocks: JSX.Element[] = [];

    for (let i = 0; i < topLevelBlocks.length; i++) {
        const block = topLevelBlocks[i];

// Handle list types specially (grouping them together)
        if (
            (block.type === "bulleted_list_item" || block.type === "numbered_list_item") &&
            (i === 0 || topLevelBlocks[i - 1].type !== block.type)
        ) {
            renderedBlocks.push(
                <ListWrapper key={block.id} blocks={topLevelBlocks} startIndex={i}/>
            );
// Skip ahead to the end of this list
            while (
                i + 1 < topLevelBlocks.length &&
                topLevelBlocks[i + 1].type === block.type
                ) {
                i++;
            }
            continue;
        }

// Render appropriate component based on block type
        let component;
        switch (block.type) {
            case "paragraph":
                component = <Paragraph key={block.id} block={block}/>;
                break;
            case "equation":
                component = <Equation key={block.id} block={block}/>;
                break;
            case "heading_1":
                component = <Heading1 key={block.id} block={block}/>;
                break;
            case "heading_2":
                component = <Heading2 key={block.id} block={block}/>;
                break;
            case "heading_3":
                component = <Heading3 key={block.id} block={block}/>;
                break;
            case "table_of_contents":
                component = <TableOfContentsBlock key={block.id} block={block} allBlocks={blocks}/>;
                break;
            case "bulleted_list_item":
            case "numbered_list_item":
// These are handled by ListWrapper
                continue;
            case "to_do":
                component = <TodoItem key={block.id} block={block}/>;
                break;
            case "toggle":
                component = <Toggle key={block.id} block={block}/>;
                break;
            case "code":
                component = <Code key={block.id} block={block}/>;
                break;
            case "quote":
                component = <Quote key={block.id} block={block}/>;
                break;
            case "callout":
                component = <Callout key={block.id} block={block}/>;
                break;
            case "divider":
                component = <Divider key={block.id} block={block}/>;
                break;
            case "image":
                component = <Image key={block.id} block={block}/>;
                break;
            case "column_list":
                component = <ColumnList key={block.id} block={block}/>;
                break;
            case "table":
                component = <TableBlock key={block.id} block={block}/>;
                break;
            case "link_preview":
                // inline icon + web page name
                // description?
                component = <LinkPreview key={block.id} block={block}/>;
                break;
            case "child_database":
                component = <ChildDatabase key={block.id} block={block}/>;
                break;
            default:
                component = (
                    <div key={block.id} className="text-muted mb-3">
                        Unsupported block type: {block.type}
                    </div>
                );
        }

        renderedBlocks.push(component);
    }

    return <div className="notion-content">{renderedBlocks}</div>;
};

export default NotionBlocks;
