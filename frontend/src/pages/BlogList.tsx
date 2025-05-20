// /StackFusionZiyiliuTop/frontend/src/pages/BlogList.tsx
import {useEffect, useState} from "react";
import {Link} from "react-router-dom";
import {Container} from "react-bootstrap";
import MainLayout from "@/components/MainLayout";
import PageHead from "@/components/PageHead";
import {apiFetchBlogList} from "@/services/api";

interface Page {
    id: string;
    title: string;
    iconHtml: string;
    cover: string | null;
    formattedLastEdited: string;
}

export default function BlogList() {
    const [pages, setPages] = useState<Page[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiFetchBlogList()
            .then((res) => {
                setPages(res.data.pages);
            })
            .catch((err) => {
                console.error("Failed to load blog list:", err);
            })
            .finally(() => setLoading(false));
    }, []);

    return (
        <MainLayout>
            <PageHead title="Blog" description="Read the latest articles"/>
            <Container className="mt-5">
                {loading ? (
                    <p>Loading…</p>
                ) : (
                    <div className="masonry">
                        {pages.map((page) => (
                            <Link
                                to={`/blog/${page.id}`}
                                key={page.id}
                                className="card mb-3 text-decoration-none"
                            >
                                {page.cover && (
                                    <img
                                        src={page.cover}
                                        className="card-img-top"
                                        alt="Cover"
                                        style={{
                                            maxHeight: 200,
                                            width: "100%",
                                            objectFit: "cover",
                                        }}
                                    />
                                )}
                                <div className="card-body">
                                    <h5 className="card-title d-flex align-items-center">
                    <span
                        dangerouslySetInnerHTML={{__html: page.iconHtml}}
                    />
                                        <span className="ms-2">{page.title}</span>
                                    </h5>
                                    <p>{page.formattedLastEdited}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </Container>
        </MainLayout>
    );
}
