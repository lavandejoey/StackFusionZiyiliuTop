import React, {useState} from "react";
import {Container, Row} from "react-bootstrap";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faGithub} from "@fortawesome/free-brands-svg-icons";
import {SiHuggingface} from "react-icons/si";
import type {Publication} from "@/types/Publication";
import {formatAuthorsForDisplay} from "@/utils/authors";
import {faCheck, faCopy} from "@fortawesome/free-solid-svg-icons";

export const PublicationCard: React.FC<Publication> = ({title, authors, url, book, repo, reviewed, bibtex}) => {
    const [bibCopied, setBibCopied] = useState(false);

    const copyBibtex = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation(); // avoid any parent click behaviour
        if (!bibtex || bibtex.trim() === "") return;

        try {
            await navigator.clipboard.writeText(bibtex);
            setBibCopied(true);
            setTimeout(() => setBibCopied(false), 1200);
        } catch {
            // fallback for older browsers
            const ta = document.createElement("textarea");
            ta.value = bibtex;
            ta.style.position = "fixed";
            ta.style.opacity = "0";
            document.body.appendChild(ta);
            ta.select();
            document.execCommand("copy");
            document.body.removeChild(ta);

            setBibCopied(true);
            setTimeout(() => setBibCopied(false), 1200);
        }
    };
    return (
        <Container className="mb-3 p-3 border rounded-3" style={{borderColor: "var(--bs-primary)"}}>
            <Row className="mb-1">
                <span className="lead m-0">
                    {url !== "#" ? (
                        <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={title}
                        >
                            {title}
                        </a>
                    ) : (
                        <span>{title}</span>
                    )}

                    {!reviewed && (
                        <span className="ms-2 badge text-reset small">(Under Review)</span>
                    )}

                    {bibtex && bibtex.trim() !== "" && (
                        <button
                            type="button"
                            onClick={copyBibtex}
                            className="btn btn-link p-0 ms-2 align-baseline"
                            style={{
                                fontSize: "0.75rem",
                                textDecoration: "none",
                                color: "var(--bs-secondary-color)",
                            }}
                            title="Copy BibTeX"
                        >
                            <FontAwesomeIcon icon={bibCopied ? faCheck : faCopy} className="me-1"/>
                            {bibCopied ? "Copied" : "BibTeX"}
                        </button>
                    )}
                </span>
                <span className="m-0 text-muted small">{formatAuthorsForDisplay(authors)}</span>
                {book && <span className="m-0 small fst-italic text-muted">{book}</span>}
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
                                        : r.type
                                            ? `https://huggingface.co/${r.type}/${r.owner}/${r.name}`
                                            : `https://huggingface.co/${r.owner}/${r.name}`
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-sm btn-outline-primary"
                                title={`${r.platform}: ${r.owner}/${r.name}${r.type ? ` (${r.type})` : ""}`}
                                style={{textDecoration: "none", fontSize: "0.75rem"}}
                            >
                                {r.platform === "github" ? (
                                    <FontAwesomeIcon icon={faGithub} className="me-1"/>
                                ) : (
                                    <>
                                        <SiHuggingface className="me-1"/>
                                    </>
                                )}
                                {r.name}
                                {r.type && <span className="ms-2 badge bg-secondary">{r.type}</span>}
                            </a>
                        ))}
                    </div>
                </Row>
            )}
        </Container>
    );
};
