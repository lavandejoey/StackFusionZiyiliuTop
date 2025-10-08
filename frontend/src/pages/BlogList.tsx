// /frontend/src/pages/BlogList.tsx
import "@/styles/masonry.css"
import React from "react";
import {useEffect, useState} from "react";
import {Link} from "react-router-dom";
import {Card, Col, Container, Spinner} from "react-bootstrap";
import MainLayout from "@/components/MainLayout";
import PageHead from "@/components/PageHead";
import type {PageObjectResponse} from "@notionhq/client";
import {getAllBlogPages} from "@/services/blogService";

function extractTitle(page: PageObjectResponse): string {
    const titleProp = Object.values(page.properties).find(
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

function extractCover(page: PageObjectResponse): string | undefined {
    if (!page.cover) return undefined;
    return page.cover.type === "external"
        ? page.cover.external.url
        : page.cover.file.url;
}

function extractIcon(page: PageObjectResponse): React.ReactNode {
    if (!page.icon) return null;
    if (page.icon.type === "emoji") {
        return <span style={{fontSize: "1.5rem"}}>{page.icon.emoji}</span>;
    }
    const url = (() => {
        switch (page.icon.type) {
            case "external":
                return page.icon.external.url;
            case "file":
                return page.icon.file.url;
            default:
                return "";
        }
    })();
    return (
        <img
            src={url}
            alt="url"
            style={{width: 24, height: 24, objectFit: "cover", borderRadius: 4}}
        />
    );
}

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}

const BlogCard: React.FC<{ page: PageObjectResponse }> = ({page}) => {
    const title = extractTitle(page);
    const cover = extractCover(page);
    const icon = extractIcon(page);
    const lastEdited = formatDate(page.last_edited_time);

    return (
        <Col>
            <Card
                as={Link}
                to={`/blog/${page.id}`}
                className="h-100 text-decoration-none"
            >
                {cover && (
                    <div className="artistic-card-img">
                        <Card.Img
                            variant="top"
                            src={cover}
                            style={{maxHeight: 200, objectFit: "cover"}}
                            alt={title}
                        />
                    </div>
                )}
                <Card.Body>
                    <Card.Title className="d-flex align-items-center">
                        {icon}
                        <span className="ms-2 text-truncate">{title}</span>
                    </Card.Title>
                    <Card.Text className="text-muted">
                        Last edited on {lastEdited}
                    </Card.Text>
                </Card.Body>
            </Card>
        </Col>
    );
};

export default function BlogList() {
    const [pages, setPages] = useState<PageObjectResponse[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        let mounted = true;
        getAllBlogPages()
            .then((list) => {
                if (mounted) setPages(list);
            })
            .catch((err) => {
                console.error("Failed to fetch blog pages:", err);
            })
            .finally(() => {
                if (mounted) setLoading(false);
            });
        return () => {
            mounted = false;
        };
    }, []);

    return (
        <MainLayout>
            <PageHead title="Blog" description="Latest articles"/>
            <Container className="mt-5">
                {loading ? (
                    <div className="d-flex justify-content-center mt-5">
                        <Spinner animation="border" role="status"/>
                    </div>
                ) : pages.length === 0 ? (
                    <p>No posts yet—check back soon!</p>
                ) : (
                    <div className="masonry">
                        {pages.map((page) => (
                            <BlogCard key={page.id} page={page}/>
                        ))}
                    </div>
                )}
            </Container>
        </MainLayout>
    );
}
