// /StackFusionZiyiliuTop/frontend/src/pages/BlogPost.tsx
import React, { type JSX, useCallback, useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Button, Card, Col, Row, Spinner } from "react-bootstrap";
import MainLayout from "@/components/MainLayout";
import PageHead from "@/components/PageHead";
import {
    type BlogPostResponse,
    getBlogPostBasic,
    getBlogPostParents,
    type BlogParent
} from "@/services/blogService";
import NotionBlocks, { TableOfContents } from "@/components/NotionBlocks";
import MathJaxProvider from "@/components/MathJaxProvider";
import type { DatabaseObjectResponse, PageObjectResponse } from "@notionhq/client";

export default function BlogPost() {
    const { id } = useParams<{ id: string }>();
    const [data, setData] = useState<BlogPostResponse | null>(null);
    const [parents, setParents] = useState<BlogParent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showToc, setShowToc] = useState(true);

    // Load blog post data with the optimized basic approach
    const loadBlogPostAndParents = useCallback(async (pageId: string) => {
        setLoading(true);
        setError(null);

        try {
            // Use getBlogPostBasic instead of getBlogPost for better performance
            const [post, postParents] = await Promise.all([
                getBlogPostBasic(pageId),
                getBlogPostParents(pageId)
            ]);
            setData(post);
            setParents(postParents);
        } catch (err) {
            console.error(`Failed to fetch blog post or parents: ${err}`);
            setError("Failed to load blog post. Please try again later.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!id) return;

        // Load blog post when component mounts or id changes
        loadBlogPostAndParents(id).then(r => r);

        return () => {
            // Clean up any pending operations if needed
        };
    }, [id, loadBlogPostAndParents]);

    // Check if we have any headings in the content
    // If we don't, we won't show the TOC
    useEffect(() => {
        if (data?.type === "page" && data.data.blocks) {
            const hasHeadings = data.data.blocks.some(block =>
                block.type === "heading_1" ||
                block.type === "heading_2" ||
                block.type === "heading_3"
            );
            setShowToc(hasHeadings);
        } else {
            setShowToc(false);
        }
    }, [data]);

    // Helper function to safely get the title from Notion page properties
    const extractTitle = (): string => {
        if (!data) return "Untitled";

        if (data.type === "page") {
            const page = data.data.page;
            const titleProp = Object.values(page.properties).find(prop => prop.type === "title");
            if (titleProp && titleProp.type === "title" && titleProp.title.length > 0) {
                return titleProp.title[0].plain_text;
            }
        } else if (data.type === "database") {
            const db = data.data.database;
            if (db.title.length > 0) {
                return db.title[0].plain_text;
            }
        }

        return "Untitled";
    }

    // Extract the cover image URL if it exists
    const getCoverImage = (): string | undefined => {
        if (!data) return undefined;
        const entity = data.type === "page" ? data.data.page : data.data.database;
        if (!entity.cover) return undefined;

        return entity.cover.type === "external"
            ? entity.cover.external.url
            : entity.cover.file.url;
    };

    function renderIcon(
        icon: PageObjectResponse["icon"] | DatabaseObjectResponse["icon"],
        opts?: { variant?: "inline" | "display"; size?: number; className?: string }
    ): JSX.Element | null {
        if (!icon) return null;

        const variant = opts?.variant ?? "inline";
        // display: fixed px size (default 36); inline: 1em, baseline aligned
        const px = opts?.size ?? 36;
        const isInline = variant === "inline";

        const baseStyle: React.CSSProperties = isInline
            ? {
                display: "inline-block",
                width: "1em",
                height: "1em",
                lineHeight: 1,
                verticalAlign: "-0.125em", // baseline align with text
            }
            : {
                display: "inline-block",
                width: px,
                height: px,
                lineHeight: 1,
                verticalAlign: "middle",
            };

        const className = opts?.className ?? "";

        const obj = icon as unknown;
        if (typeof obj === "object" && obj !== null && "type" in obj) {
            const typed = obj as Record<string, unknown>;
            const type = typeof typed.type === "string" ? typed.type : undefined;
            if (type === "emoji") {
                const emo = typeof typed.emoji === "string" ? typed.emoji : "";
                return (
                    <span
                        className={className}
                        style={{ ...baseStyle, fontSize: isInline ? "1em" : px }}
                        aria-hidden="true"
                    >
                        {emo}
                    </span>
                );
            }

            let url: string | undefined;
            if (type === "external") {
                const external = typed.external as Record<string, unknown> | undefined;
                url = typeof external?.url === "string" ? (external.url as string) : undefined;
            } else if (type === "file") {
                const file = typed.file as Record<string, unknown> | undefined;
                url = typeof file?.url === "string" ? (file.url as string) : undefined;
            }

            if (!url) return null;

            return (
                <img
                    className={className}
                    src={url}
                    alt=""
                    style={{
                        ...baseStyle,
                        objectFit: "cover",
                        borderRadius: isInline ? 2 : 8,
                    }}
                />
            );
        }

        return null;
    }

    // Format the last edited date
    const formatDate = (iso: string): string => {
        return new Date(iso).toLocaleDateString(undefined, {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };
    const coverImage = getCoverImage();
    const renderDatabaseView = () => {
        if (data?.type !== "database") return null;
        const { pages } = data.data;

        return (
            <div className="table-responsive">
                <table className="table table-hover">
                    <thead>
                        <tr>
                            <th scope="col" style={{ width: "2rem" }}></th>
                            <th scope="col">Title</th>
                            <th scope="col">Last Updated</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pages.map(page => {
                            const titleProp = Object.values(page.properties).find(p => p.type === "title");
                            const title = (titleProp && titleProp.type === "title" && titleProp.title.length > 0)
                                ? titleProp.title[0].plain_text
                                : "Untitled";

                            return (
                                <tr key={page.id}>
                                    <td>
                                        {page.icon && page.icon.type === "emoji" && (
                                            <span>{page.icon.emoji}</span>
                                        )}
                                    </td>
                                    <td>
                                        <Link to={`/blog/${page.id}`} className="text-decoration-none">
                                            {title}
                                        </Link>
                                    </td>
                                    <td>{formatDate(page.last_edited_time)}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <MainLayout>
            <PageHead title={extractTitle()} />
            <Row className="container-lg mt-5 mx-0 mx-lg-auto px-0 px-lg-auto">
                {loading ? (
                    <div className="d-flex justify-content-center">
                        <Spinner animation="border" />
                    </div>
                ) : error ? (
                    <div className="alert alert-danger">
                        {error}
                        <Button variant={"link"} onClick={() => id && loadBlogPostAndParents(id)}>
                            <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                            &nbsp;Retry
                        </Button>
                    </div>
                ) : !data ? (
                    <p>Post not found.</p>
                ) : (
                    <Row className="blog-post">
                        {/* Breadcrumb navigation */}
                        <nav aria-label="breadcrumb" className="mb-3">
                            <ol className="breadcrumb mb-0" style={{ fontSize: "0.9rem" }}>
                                {parents.map((parent) => {
                                    if (parent.object === 'database') return null;

                                    let title = "Untitled";
                                    if ('properties' in parent && 'title' in parent.properties && parent.properties.title.type === 'title' && parent.properties.title.title.length > 0) {
                                        title = parent.properties.title.title[0].plain_text;
                                    } else if ('title' in parent && Array.isArray(parent.title) && parent.title.length > 0) {
                                        title = parent.title[0].plain_text;
                                    }

                                    return (
                                        <li key={parent.id} className="breadcrumb-item">
                                            <Link to={`/blog/${parent.id}`} className="text-decoration-none">
                                                {renderIcon(parent.icon, {
                                                    variant: "inline",
                                                    size: 16,
                                                    className: "me-1"
                                                })}
                                                {title}
                                            </Link>
                                        </li>
                                    );
                                })}
                                <li className="breadcrumb-item active" aria-current="page">
                                    <span style={{
                                        maxWidth: "400px",
                                        display: "inline-block",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                        verticalAlign: "middle"
                                    }}>
                                        {extractTitle()}
                                    </span>
                                </li>
                            </ol>
                        </nav>
                        {/* Header with title and cover */}
                        <Card className="border-0">
                            {coverImage && (
                                <div className="artistic-card-img">
                                    <Card.Img
                                        className="img-fluid rounded img-vfade"
                                        variant="top"
                                        src={coverImage}
                                        style={{
                                            width: "100%",
                                            maxHeight: "200px",
                                            aspectRatio: "16/9",
                                            objectFit: "cover",
                                            objectPosition: "center"
                                        }}
                                        alt={extractTitle()}
                                    />
                                </div>
                            )}
                            <Card.Body className={coverImage ? "mt-3" : "mt-0"}>
                                <div className="d-flex align-items-center mb-2">
                                    {renderIcon(data.type === "page" ? data.data.page.icon : data.data.database.icon, {
                                        variant: "display",
                                        size: 48,
                                        className: "me-3"
                                    })}
                                    <h1 className="mb-0">{extractTitle()}</h1>
                                </div>
                                <p className="text-muted">
                                    Last updated
                                    on {formatDate(data.type === "page" ? data.data.page.last_edited_time : data.data.database.last_edited_time)}
                                </p>
                            </Card.Body>
                        </Card>

                        {/* Two column layout for content and TOC */}
                        <MathJaxProvider>
                            {/* MOBILE: TOC as a dedicated top row inside content flow */}
                            {showToc && (
                                <Row className="d-lg-none">
                                    <Col xs={12}>
                                        <TableOfContents
                                            blocks={data.type === "page" ? data.data.blocks : []}
                                            mode="mobile"
                                            title="On this page"
                                        />
                                    </Col>
                                </Row>
                            )}
                            <Row>
                                {/* Main content column */}
                                <Col xs={12} md={showToc ? 8 : 12} lg={showToc ? 9 : 12} className="blog-main-content">
                                    {data.type === "page" ? (
                                        <>
                                            <NotionBlocks blocks={data.data.blocks} />
                                            <style>{`
.notion-content {
  --indent-step: clamp(0.6rem, 2.4vw, 1.25rem);
}
`}</style>
                                        </>
                                    ) : (
                                        renderDatabaseView()
                                    )}
                                </Col>

                                {/* Table of Contents sidebar */}
                                {/* Desktop TOC in sidebar */}
                                {showToc && (
                                    <Col md={4} lg={3} className="d-none d-lg-block">
                                        <TableOfContents blocks={data.type === "page" ? data.data.blocks : []}
                                            mode="desktop" title="On this page" />
                                    </Col>
                                )}
                                {/*{showToc && (*/}
                                {/*    <Col md={4} lg={3} className="d-none d-lg-block">*/}
                                {/*        <TableOfContents blocks={data.type === "page" ? data.data.blocks : []}/>*/}
                                {/*    </Col>*/}
                                {/*)}*/}
                            </Row>
                        </MathJaxProvider>
                    </Row>
                )}
            </Row>
        </MainLayout>
    );
}
