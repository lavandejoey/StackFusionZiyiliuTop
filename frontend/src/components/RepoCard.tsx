// src/components/RepoCard.tsx
import React from "react";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {
    faStar,
    faCodeFork,
    faHeart,
    faDownload,
    faShieldAlt,
    faTags,
    faGlobe,
    faCircleDot
} from "@fortawesome/free-solid-svg-icons";
import {faGithub} from "@fortawesome/free-brands-svg-icons";
import {Card, CardBody, CardTitle, Col, Row} from "react-bootstrap";

// ---- Types ----
export type RepoPlatform = "github" | "huggingface";

export interface RepoProps {
    platform: RepoPlatform;        // "github" | "huggingface"
    url: string;                   // 仓库 / Space / Model 链接
    owner: string;                 // 拥有者
    name: string;                  // 仓库名 / Space 名 / Model 名
    description?: string;          // 简介
    topics?: string[];             // 主题标签
    language?: string;             // GitHub 常见字段
    license?: string;              // 许可证名称
    stars?: number;                // GitHub stars
    forks?: number;                // GitHub forks
    issues?: number;               // GitHub issues
    likes?: number;                // HF likes
    downloads?: number;            // HF downloads
    lastUpdated?: string | Date;   // 更新时间
    previewImg?: string;           // 预览图（可选）
    visibility?: string;           // 角标，如 "Featured"
    compact?: boolean;             // 是否紧凑样式
    // pinned?: boolean;              // 是否置顶
}

// ---- Helpers ----
const formatNum = (n?: number) => {
    if (n == null) return undefined;
    if (n < 1000) return String(n);
    if (n < 10000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
    if (n < 1000000) return Math.round(n / 1000) + "k";
    return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
};

const platformBadge = (platform: RepoPlatform) => {
    if (platform === "github") {
        return (
            <span className="d-inline-flex align-items-center gap-1">
        <FontAwesomeIcon icon={faGithub}/> GitHub
      </span>
        );
    }
    // HuggingFace 简洁表示：品牌图标不在 FA 免费库中，这里用 🤗
    return (
        <span className="d-inline-flex align-items-center gap-1">
      <span style={{fontSize: 16, lineHeight: 1}}>🤗</span> Hugging Face
    </span>
    );
};

// ---- Main function component ----
export const RepoCard: React.FC<RepoProps> = ({
                                                  platform,
                                                  url,
                                                  owner,
                                                  name,
                                                  description,
                                                  topics = [],
                                                  language,
                                                  license,
                                                  stars,
                                                  forks,
                                                  issues,
                                                  likes,
                                                  downloads,
                                                  lastUpdated,
                                                  previewImg,
                                                  visibility,
                                                  compact = false,
                                                  // pinned
                                              }) => {
    const updated =
        lastUpdated
            ? new Date(lastUpdated).toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "2-digit"
            })
            : undefined;

    const statItems: Array<React.ReactNode> = [];

    // GitHub 常见指标
    if (platform === "github") {
        if (stars != null)
            statItems.push(
                <span key="stars" className="me-3">
          <FontAwesomeIcon icon={faStar}/> {formatNum(stars)}
        </span>
            );
        if (forks != null)
            statItems.push(
                <span key="forks" className="me-3">
          <FontAwesomeIcon icon={faCodeFork}/> {formatNum(forks)}
        </span>
            );
        if (issues != null)
            statItems.push(
                <span key="issues" className="me-3">
          <FontAwesomeIcon icon={faCircleDot}/> {formatNum(issues)}
        </span>
            );
    }

    // HuggingFace 常见指标
    if (platform === "huggingface") {
        if (likes != null)
            statItems.push(
                <span key="likes" className="me-3">
          <FontAwesomeIcon icon={faHeart}/> {formatNum(likes)}
        </span>
            );
        if (downloads != null)
            statItems.push(
                <span key="dl" className="me-3">
          <FontAwesomeIcon icon={faDownload}/> {formatNum(downloads)}
        </span>
            );
    }

    return (
        <Card className={`border-1 shadow-sm ${compact ? "p-2" : ""}`}>
            {previewImg && !compact && (
                <img
                    src={previewImg}
                    alt={`${owner}/${name} preview`}
                    className="card-img-top"
                    style={{objectFit: "cover", maxHeight: 180}}
                />
            )}

            <CardBody>
                <Row className="align-items-start">
                    <Col>
                        <a href={url} target="_blank" rel="noreferrer" className="text-decoration-none">
                            <CardTitle as="h5" className="mb-1 text-truncate">
                                {name}
                            </CardTitle>
                        </a>
                        <small className="text-muted">{platformBadge(platform)}</small>
                    </Col>

                    {visibility && (
                        <Col xs="auto">
                            <span
                                className="badge bg-primary-subtle text-primary-emphasis rounded-pill">{visibility}</span>
                        </Col>
                    )}
                </Row>

                {description && (
                    <p className="card-text mt-2 mb-2" style={{whiteSpace: "pre-line"}}>
                        {description}
                    </p>
                )}

                {/* Topics */}
                {topics.length > 0 && (
                    <div className="mb-2">
                        <small className="text-muted me-2">
                            <FontAwesomeIcon icon={faTags}/>
                        </small>
                        {topics.map((t) => (
                            <span key={t} className="badge text-muted me-1 mb-1">{t}</span>
                        ))}
                    </div>
                )}

                {/* Meta */}
                <div className="d-flex flex-wrap align-items-center text-muted small">
                    {language && (
                        <span className="me-3">
              <FontAwesomeIcon icon={faGlobe}/> {language}
            </span>
                    )}
                    {license && (
                        <span className="me-3">
              <FontAwesomeIcon icon={faShieldAlt}/> {license}
            </span>
                    )}
                    {updated && <span className="me-3">Updated {updated}</span>}
                    {statItems}
                </div>
            </CardBody>
        </Card>
    );
};
