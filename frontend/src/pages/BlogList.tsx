// /StackFusionZiyiliuTop/frontend/src/pages/BlogList.tsx
import {useEffect, useState} from "react";
import {Link} from "react-router-dom";
import {Container} from "react-bootstrap";
import MainLayout from "@/components/MainLayout";
import PageHead from "@/components/PageHead";
import {apiFetchBlogList} from "@/services/api";
import {Spinner} from "react-bootstrap";
import "@/styles/masonry.css";

interface PageCard {
    id: string;
    title: string;
    iconHtml: string;
    cover: string | null;
    formattedLastEdited: string;
}

export default function BlogList() {
    const [pages, setPages] = useState<PageCard[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiFetchBlogList()
            .then((r) => setPages(r.data.pages))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    return (
        <MainLayout>
            <PageHead title="Blog" description="Latest articles"/>
            <Container className="mt-5">
                {loading ? (
                    <div className="d-flex justify-content-center mt-5">
                        <Spinner animation="border" role="status"/>
                    </div>
                ) : (
                    <div className="masonry">
                        {pages.map((p) => (
                            <Link key={p.id} to={`/blog/${p.id}`} className="card mb-3 text-decoration-none">
                                {p.cover && (
                                    <img
                                        src={p.cover}
                                        className="card-img-top"
                                        style={{maxHeight: 200, objectFit: "cover"}}
                                        alt={p.title}
                                    />
                                )}
                                <div className="card-body">
                                    <h5 className="card-title d-flex align-items-center">
                                        <span dangerouslySetInnerHTML={{__html: p.iconHtml}}/>
                                        <span className="ms-2">{p.title}</span>
                                    </h5>
                                    <p>{p.formattedLastEdited}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </Container>
        </MainLayout>
    );
}
