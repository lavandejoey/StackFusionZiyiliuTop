// /StackFusionZiyiliuTop/frontend/src/pages/BlogPost.tsx
import {useEffect, useState} from "react";
import {useParams, Link} from "react-router-dom";
import {Container, Button} from "react-bootstrap";
import {apiFetchBlogPost} from "@/services/api";
import MainLayout from "@/components/MainLayout";
import PageHead from "@/components/PageHead";

interface PageMeta {
    id: string;
    title: string;
    description?: string;
    parent?: { id: string };
    iconHtml: string;
}

export default function BlogPost() {
    const {pageId} = useParams<{ pageId: string }>();
    const [page, setPage] = useState<PageMeta | null>(null);
    const [html, setHtml] = useState<string>("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!pageId) return;
        apiFetchBlogPost(pageId)
            .then((res) => {
                setPage(res.data.pageData);
                setHtml(res.data.html);
            })
            .catch((err) => {
                console.error("Failed to load blog post:", err);
            })
            .finally(() => setLoading(false));
    }, [pageId]);

    if (loading) return <MainLayout><p>Loading…</p></MainLayout>;
    if (!page) return <MainLayout><p>Post not found.</p></MainLayout>;

    return (
        <MainLayout>
            <PageHead title={page.title} description={page.description || ""}/>
            <Container fluid className="mt-5">
                <Button variant="link" as={Link as any} to="/blog" className="mb-3">
                    &larr; Back to Blog
                </Button>
                <h1 className="mb-3">{page.title}</h1>
                <div dangerouslySetInnerHTML={{__html: html}}/>
            </Container>
        </MainLayout>
    );
}
