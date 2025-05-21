// /StackFusionZiyiliuTop/frontend/src/pages/BlogPost.tsx
import {useEffect, useState} from "react";
import {useParams} from "react-router-dom";
import {Container, Button, Spinner} from "react-bootstrap";
import MainLayout from "@/components/MainLayout";
import PageHead from "@/components/PageHead";
import {apiFetchBlogPost} from "@/services/api";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faArrowLeft} from "@fortawesome/free-solid-svg-icons";

interface Parent {
    type: string;
    id?: string;
    database_id?: string;
    page_id?: string;
}

interface PageMeta {
    id: string;
    title: string;
    description?: string;
    parent: Parent;
    iconHtml: string;
}

export default function BlogPost() {
    const {pageId} = useParams<{ pageId: string }>();
    const [meta, setMeta] = useState<PageMeta | null>(null);
    const [html, setHtml] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!pageId) return;
        apiFetchBlogPost(pageId)
            .then((r) => {
                setMeta(r.data.pageData);
                setHtml(r.data.html);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [pageId]);

    if (loading) return <MainLayout>
        <div className="d-flex justify-content-center mt-5"><Spinner animation="border" role="status"/></div>
    </MainLayout>;
    if (!meta) return <MainLayout>
        <div className="d-flex justify-content-center mt-5"><h3>Not found</h3></div>
    </MainLayout>;

    /* back-link logic – if parent is a page jump there, else blog home   :contentReference[oaicite:3]{index=3} */
    const backHref = meta.parent?.type === "page_id" ? `/blog/${meta.parent.id}` : "/blog";

    return (
        <MainLayout>
            <PageHead title={meta.title} description={meta.description || ""}/>
            <Container fluid className="mt-5">
                <div className="d-flex justify-content-between mb-3">
                    <Button variant="outline-secondary" href={backHref}>
                        <FontAwesomeIcon icon={faArrowLeft}/>
                        <span className="ms-2">Back</span>
                    </Button>
                </div>
                <h1 className="mb-3">{meta.title}</h1>
                <div dangerouslySetInnerHTML={{__html: html}}/>
            </Container>
        </MainLayout>
    );
}
