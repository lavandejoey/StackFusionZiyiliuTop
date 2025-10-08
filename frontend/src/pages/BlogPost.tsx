// /StackFusionZiyiliuTop/frontend/src/pages/BlogPost.tsx
import {type JSX, useCallback, useEffect, useState} from "react";
import {useParams, Link} from "react-router-dom";
import {Button, Card, Col, Container, Row, Spinner} from "react-bootstrap";
import MainLayout from "@/components/MainLayout";
import PageHead from "@/components/PageHead";
import {
    type BlogPostResponse,
    getBlogPostBasic,
    getBlogPostParents,
    type BlogParent
} from "@/services/blogService";
import NotionBlocks, {TableOfContents} from "@/components/NotionBlocks";
import MathJaxProvider from "@/components/MathJaxProvider";

export default function BlogPost() {
    const {id} = useParams<{ id: string }>();
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
        loadBlogPostAndParents(id);

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

    // Extract page icon if it exists
    const getPageIcon = (): React.ReactNode => {
        if (!data) return null;
        const entity = data.type === "page" ? data.data.page : data.data.database;
        if (!entity.icon) return null;

        if (entity.icon.type === "emoji") {
            return <span style={{fontSize: "2rem"}}>{entity.icon.emoji}</span>;
        }

        if (entity.icon.type === "external") {
            return (
                <img
                    src={entity.icon.external.url}
                    alt="Page icon"
                    style={{width: 36, height: 36, objectFit: "cover", borderRadius: 4}}
                />
            );
        } else if (entity.icon.type === "file") {
            return (
                <img
                    src={entity.icon.file.url}
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

    const renderDatabaseView = () => {
        if (data?.type !== "database") return null;
        const {pages} = data.data;

        return (
            <div className="table-responsive">
                <table className="table table-hover">
                    <thead>
                    <tr>
                        <th scope="col" style={{width: "2rem"}}></th>
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

    const renderParentIcon = (parent: BlogParent): JSX.Element => {
        const parentIcon = 'icon' in parent ? parent.icon : null;
        if (!parentIcon) return <></>

        if (parentIcon.type === "emoji") {
            return <span className="me-1">{parentIcon.emoji}</span>;
        }

        const iconStyle: React.CSSProperties = {
            width: 18,
            height: 18,
            objectFit: "cover",
            borderRadius: 3,
            verticalAlign: "text-bottom",
        };

        if (parentIcon.type === "external") {
            return <img src={parentIcon.external.url} alt="Icon" className="me-1" style={iconStyle}/>;
        } else if (parentIcon.type === "file") {
            return <img src={parentIcon.file.url} alt="Icon" className="me-1" style={iconStyle}/>;
        }

        return <></>;
    };

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
                        <Button variant={"link"} onClick={() => id && loadBlogPostAndParents(id)}>
                            <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true"/>
                            &nbsp;Retry
                        </Button>
                    </div>
                ) : !data ? (
                    <p>Post not found.</p>
                ) : (
                    <MathJaxProvider>
                        <div className="blog-post">
                            {/* Breadcrumb navigation */}
                            <nav aria-label="breadcrumb" className="mb-3">
                                <ol className="breadcrumb mb-0" style={{fontSize: "0.9rem"}}>
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
                                                    {renderParentIcon(parent)}
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
                                        Last updated
                                        on {formatDate(data.type === "page" ? data.data.page.last_edited_time : data.data.database.last_edited_time)}
                                    </p>
                                </Card.Body>
                            </Card>

                            {/* Two column layout for content and TOC */}
                            <Row>
                                {/* Main content column */}
                                <Col lg={showToc ? 9 : 12} className="blog-main-content">
                                    {data.type === "page" ? (
                                        <NotionBlocks blocks={data.data.blocks}/>
                                    ) : (
                                        renderDatabaseView()
                                    )}
                                </Col>

                                {/* Table of Contents sidebar */}
                                {showToc && (
                                    <Col lg={3} className="d-none d-lg-block">
                                        <TableOfContents blocks={data.type === "page" ? data.data.blocks : []}/>
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
