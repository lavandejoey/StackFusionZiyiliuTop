// /StackFusionZiyiliuTop/frontend/src/pages/BlogPost.tsx
import React, {useCallback, useEffect, useState} from "react";
import {useParams} from "react-router-dom";
import {Button, Card, Col, Container, Row, Spinner} from "react-bootstrap";
import MainLayout from "@/components/MainLayout";
import PageHead from "@/components/PageHead";
import {type BlogPostResponse, getBlogPostBasic} from "@/services/blogService";
import NotionBlocks, {TableOfContents} from "@/components/NotionBlocks";
import MathJaxProvider from "@/components/MathJaxProvider";

export default function BlogPost() {
    const {id} = useParams<{ id: string }>();
    const [data, setData] = useState<BlogPostResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showToc, setShowToc] = useState(true);

    // Load blog post data with the optimized basic approach
    const loadBlogPost = useCallback(async (pageId: string) => {
        setLoading(true);
        setError(null);

        try {
            // Use getBlogPostBasic instead of getBlogPost for better performance
            const post = await getBlogPostBasic(pageId);
            setData(post);
        } catch (err) {
            console.error(`Failed to fetch blog post: ${err}`);
            setError("Failed to load blog post. Please try again later.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!id) return;

        // Load blog post when component mounts or id changes
        loadBlogPost(id);

        return () => {
            // Clean up any pending operations if needed
        };
    }, [id, loadBlogPost]);

    // Check if we have any headings in the content
    // If we don't, we won't show the TOC
    useEffect(() => {
        if (data?.blocks) {
            const hasHeadings = data.blocks.some(block =>
                block.type === "heading_1" ||
                block.type === "heading_2" ||
                block.type === "heading_3"
            );
            setShowToc(hasHeadings);
        }
    }, [data?.blocks]);

    // Helper function to safely get the title from Notion page properties
    const extractTitle = (): string => {
        if (!data?.page || !data.page.properties) return "Untitled";
        const titleProp = Object.values(data.page.properties).find(
            (prop) => prop.type === "title"
        );
        if (
            titleProp &&
            titleProp.type === "title" &&
            titleProp.title.length > 0
        ) {
            return titleProp.title[0].plain_text;
        }
        return "Untitled";
    }

    // Extract the cover image URL if it exists
    const getCoverImage = (): string | undefined => {
        if (!data?.page?.cover) return undefined;

        return data.page.cover.type === "external"
            ? data.page.cover.external.url
            : data.page.cover.file.url;
    };

    // Extract page icon if it exists
    const getPageIcon = (): React.ReactNode => {
        if (!data?.page?.icon) return null;

        if (data.page.icon.type === "emoji") {
            return <span style={{fontSize: "2rem"}}>{data.page.icon.emoji}</span>;
        }

        // Handle external or file type icons
        if (data.page.icon.type === "external") {
            return (
                <img
                    src={data.page.icon.external.url}
                    alt="Page icon"
                    style={{width: 36, height: 36, objectFit: "cover", borderRadius: 4}}
                />
            );
        } else if (data.page.icon.type === "file") {
            return (
                <img
                    src={data.page.icon.file.url}
                    alt="Page icon"
                    style={{width: 36, height: 36, objectFit: "cover", borderRadius: 4}}
                />
            );
        }

        return null;
    };

    // Format the last edited date
    const formatDate = (iso: string): string => {
        return new Date(iso).toLocaleDateString(undefined, {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    const coverImage = getCoverImage();
    const icon = getPageIcon();

    return (
        <MainLayout>
            <PageHead title={extractTitle()}/>
            <Container className="mt-5">
                {loading ? (
                    <div className="d-flex justify-content-center">
                        <Spinner animation="border"/>
                    </div>
                ) : error ? (
                    <div className="alert alert-danger">
                        {error}
                        <Button variant={"link"} onClick={() => id && loadBlogPost(id)}>
                            <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true"/>
                            &nbsp;Retry
                        </Button>
                    </div>
                ) : !data ? (
                    <p>Post not found.</p>
                ) : (
                    <MathJaxProvider>
                        <div className="blog-post">
                            {/* Header with title and cover */}
                            <Card className="border-0">
                                {coverImage && (
                                    <div className="artistic-card-img">
                                        <Card.Img
                                            variant="top"
                                            src={coverImage}
                                            style={{
                                                height: "300px",
                                                objectFit: "cover",
                                                objectPosition: "center"
                                            }}
                                            alt={extractTitle()}
                                        />
                                    </div>
                                )}
                                <Card.Body className={coverImage ? "mt-3" : "mt-0"}>
                                    <div className="d-flex align-items-center mb-2">
                                        {icon && <div className="me-3">{icon}</div>}
                                        <h1 className="mb-0">{extractTitle()}</h1>
                                    </div>
                                    <p className="text-muted">
                                        Last updated on {formatDate(data.page.last_edited_time)}
                                    </p>
                                </Card.Body>
                            </Card>

                            {/* Two column layout for content and TOC */}
                            <Row>
                                {/* Main content column */}
                                <Col lg={showToc ? 9 : 12} className="blog-main-content">
                                    <NotionBlocks blocks={data.blocks}/>
                                </Col>

                                {/* Table of Contents sidebar */}
                                {showToc && (
                                    <Col lg={3} className="d-none d-lg-block">
                                        <TableOfContents blocks={data.blocks}/>
                                    </Col>
                                )}
                            </Row>
                        </div>
                    </MathJaxProvider>
                )}
            </Container>
        </MainLayout>
    );
}
