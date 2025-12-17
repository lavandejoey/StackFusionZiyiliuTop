import React from "react";
import { Container, Row } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExternalLinkAlt } from "@fortawesome/free-solid-svg-icons";
import { faGithub } from "@fortawesome/free-brands-svg-icons";
import { SiHuggingface } from "react-icons/si";
import type { Publication } from "@/types/Publication";
import { formatAuthorsForDisplay } from "@/utils/authors";

export const PublicationCard: React.FC<Publication> = ({
    title,
    authors,
    url,
    repo,
}) => {
    return (
        <Container className="mb-3 p-3 border rounded-3" style={{ borderColor: "var(--bs-primary)" }}>
            <Row className="mb-2">
                <h6 className="m-0 mb-1">
                    <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ textDecoration: "none", color: "inherit" }}
                        title={title}
                    >
                        {title}
                        <FontAwesomeIcon
                            icon={faExternalLinkAlt}
                            size="xs"
                            className="ms-2"
                            style={{ opacity: 0.6 }}
                        />
                    </a>
                </h6>
            </Row>
            <Row>
                <p className="m-0 text-muted small">{formatAuthorsForDisplay(authors)}</p>
            </Row>
            {repo && repo.length > 0 && (
                <Row className="mt-2">
                    <div className="d-flex flex-wrap gap-2">
                        {repo.map((r, idx) => (
                            <a
                                key={idx}
                                href={
                                    r.platform === "github"
                                        ? `https://github.com/${r.owner}/${r.name}`
                                        : r.type ? `https://huggingface.co/${r.type}/${r.owner}/${r.name}` : `https://huggingface.co/${r.owner}/${r.name}`
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-sm btn-outline-primary"
                                title={`${r.platform}: ${r.owner}/${r.name}${r.type ? ` (${r.type})` : ""}`}
                                style={{ textDecoration: "none", fontSize: "0.75rem" }}
                            >
                                {r.platform === "github" ? (
                                    <FontAwesomeIcon icon={faGithub} className="me-1" />
                                ) : (
                                    <SiHuggingface className="me-1" style={{ display: "inline" }} />
                                )}
                                {r.name}
                                {r.type && <span className="ms-1 badge bg-secondary">{r.type}</span>}
                            </a>
                        ))}
                    </div>
                </Row>
            )}
        </Container>
    );
};
