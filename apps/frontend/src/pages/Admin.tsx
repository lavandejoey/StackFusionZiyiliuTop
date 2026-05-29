// /StackFusionZiyiliuTop/frontend/src/pages/Admin.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Container, Row, Col, Card, Table, Spinner, Alert, Button, ProgressBar, Badge, Modal } from "react-bootstrap";
import { fetchAnalyticsBriefing } from "@/services/analyticsService";
import { type BriefingData } from "@/services/axios";
import { getUserRoles, listAllUsers } from "@/services/userService";
import { UserRole, type UserModel } from "@/types/User";
import { useTranslation } from "react-i18next";
import PageHead from "@/components/PageHead";
import MainLayout from "@/components/MainLayout";
import ipCountryCache from "@config/ipCountryCache.json";
import { flag as countryEmojiFlag } from "country-emoji";

export default function AdminPage() {
    const { t } = useTranslation();
    const [brief, setBrief] = useState<BriefingData | null>(null);
    const [users, setUsers] = useState<UserModel[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    // pagination state: default pageSize 15 as requested
    const [page, setPage] = useState<number>(1);
    const pageSize = 15;
    const [hasMore, setHasMore] = useState<boolean>(false);
    const [showRecentModal, setShowRecentModal] = useState(false);
    const [recentPage, setRecentPage] = useState(1);
    const recentPageSize = 15;
    const tableRef = useRef<HTMLDivElement | null>(null);

    const metrics = brief?.metrics;
    const recentVisits = useMemo(() => brief?.recent ?? [], [brief]);
    const rollups = brief?.rollups ?? [];
    const topPaths = metrics?.top_paths_today ?? [];
    const topRefs = metrics?.top_ref_today ?? [];

    const truncateValue = (s: string, len = 8) => (s?.length ?? 0) > len ? `${s.slice(0, len)}…` : s;

    const userRoleLabels: Record<number, string> = {
        [UserRole.ADMIN]: t("Admin"),
        [UserRole.USER_MANAGER]: t("Manager"),
        [UserRole.USER_FRIEND]: t("Friend"),
        [UserRole.USER_GUEST]: t("Guest"),
    };

    const roleSummary = (users ?? []).reduce<Record<string, number>>((acc, u) => {
        const label = u.role ? userRoleLabels[u.role] ?? t("User") : t("User");
        acc[label] = (acc[label] ?? 0) + 1;
        return acc;
    }, {});

    const statusKeys = ["active", "inactive"];
    const statusSummary = statusKeys.reduce<Record<string, number>>((acc, key) => {
        acc[key] = 0;
        return acc;
    }, {});
    (users ?? []).forEach(u => {
        const status = (u.status ?? "unknown").toLowerCase();
        statusSummary[status] = (statusSummary[status] ?? 0) + 1;
    });

    const totalUsers = users?.length ?? 0;

    const ipToCountry = (ipMask?: string | null) => {
        if (!ipMask) return null;
        if (ipCountryCache[ipMask as keyof typeof ipCountryCache]) {
            return ipCountryCache[ipMask as keyof typeof ipCountryCache];
        }
        const ipOnly = ipMask.split("/")[0];
        if (ipOnly && ipCountryCache[ipOnly as keyof typeof ipCountryCache]) {
            return ipCountryCache[ipOnly as keyof typeof ipCountryCache];
        }
        return null;
    };

    const countryFlag = (code?: string | null) => {
        if (!code || code.length !== 2) return "";
        const up = code.toUpperCase();
        return countryEmojiFlag(up) || "";
    };

    const renderIpWithFlag = (ipMask?: string | null) => {
        if (!ipMask) return t("unknown");
        const cc = ipToCountry(ipMask);
        const flag = cc ? countryFlag(cc) : "";
        return `${flag ? flag + " " : ""}${ipMask}`;
    };

    const formatDate = (iso: string) => new Intl.DateTimeFormat(undefined, {
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(iso));

    const orderedRecent = useMemo(() => [...recentVisits], [recentVisits]);
    const recentPreview = useMemo(() => orderedRecent.slice(0, 5), [orderedRecent]);
    const totalRecentPages = useMemo(
        () => Math.max(1, Math.ceil(orderedRecent.length / recentPageSize)),
        [orderedRecent.length],
    );
    const pagedRecent = useMemo(() => {
        const start = (recentPage - 1) * recentPageSize;
        return orderedRecent.slice(start, start + recentPageSize);
    }, [orderedRecent, recentPage]);

    useEffect(() => {
        if (showRecentModal) setRecentPage(1);
    }, [showRecentModal]);

    // Fetch briefing and paginated users whenever `page` changes
    useEffect(() => {
        let mounted = true;
        (async () => {
            setLoading(true);
            setError(null);
            try {
                const [b, rawUsers] = await Promise.all([
                    fetchAnalyticsBriefing(),
                    listAllUsers(page, pageSize),
                ]);

                if (!mounted) return;
                setBrief(b);

                const usersWithRoles = await Promise.all((rawUsers ?? []).map(async (u: UserModel) => {
                    try {
                        const roles = await getUserRoles(u.uuid);
                        return { ...u, role: roles?.[0] ?? null };
                    } catch (e: unknown) {
                        console.warn(`Failed to fetch roles for user ${u.uuid}:`, e);
                        return { ...u, role: null };
                    }
                }));

                if (!mounted) return;
                setUsers(usersWithRoles);
                // If backend returned exactly pageSize items, there may be more pages.
                setHasMore((rawUsers ?? []).length === pageSize);
            } catch (e: unknown) {
                if (!mounted) return;
                console.error("Admin page load failed", e);
                const msg = e instanceof Error ? e.message : String(e);
                setError(msg);
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        })();

        return () => {
            mounted = false;
        };
    }, [page]);

    const scrollToTable = () => {
        if (tableRef.current) {
            tableRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    };

    return (
        <MainLayout activePage={"Admin"}>
            <PageHead
                title={t("Admin Dashboard") + " - " + t("LIU Ziyi Personal Website")}
                description={t("Administrative dashboard for site analytics and user management.")}
            />

            {/* Use same background/wrapper pattern as other pages: center content in a full-width flex container */}
            <div className="container-fluid flex-grow-1 d-flex justify-content-center align-items-center">
                <Container className="py-4">

                    {error && <Alert variant="danger">{error}</Alert>}

                    {loading ? (
                        <div className="d-flex justify-content-center py-5">
                            <Spinner animation="border" role="status" />
                        </div>
                    ) : (
                        <>
                            <Row className="g-4 mb-4">
                                <Col lg={4}>
                                    <Card className="rounded-3 h-100 shadow-sm" role="region"
                                        aria-label="Visitor statistics">
                                        <Card.Body>
                                            <Card.Title>{t("Visitor Info")}</Card.Title>
                                            {metrics ? (
                                                <div className="d-flex flex-column gap-2">
                                                    <div className="d-flex justify-content-between">
                                                        <div>
                                                            <div className="text-muted small">{t("Today Page Views")}</div>
                                                            <div className="fs-4">{metrics.pv_today}</div>
                                                        </div>
                                                        <div>
                                                            <div className="text-muted small">{t("Today Unique Visitors")}</div>
                                                            <div className="fs-4">{metrics.uv_today}</div>
                                                        </div>
                                                    </div>
                                                    <div className="d-flex justify-content-between">
                                                        <div>
                                                            <div className="text-muted small">{t("7d Page Views")}</div>
                                                            <div className="fs-6">{metrics.pv_7d}</div>
                                                        </div>
                                                        <div>
                                                            <div className="text-muted small">{t("7d Unique Visitors")}</div>
                                                            <div className="fs-6">{metrics.uv_7d}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-muted">{t("No analytics data available")}</div>
                                            )}
                                        </Card.Body>
                                    </Card>
                                </Col>

                                <Col lg={4}>
                                    <Card className="rounded-3 h-100 shadow-sm" role="region"
                                        aria-label="Top paths today">
                                        <Card.Body>
                                            <Card.Title>{t("Top Paths Today")}</Card.Title>
                                            {topPaths.length ? topPaths.slice(0, 6).map(([p, c]) => {
                                                const max = topPaths[0]?.[1] || 1;
                                                const percent = Math.round((c / max) * 100);
                                                return (
                                                    <div key={p} className="mb-2">
                                                        <div className="d-flex justify-content-between small">
                                                            <span className="text-monospace">{p}</span>
                                                            <span className="text-muted">{c}</span>
                                                        </div>
                                                        <ProgressBar now={percent} variant="info" visuallyHidden />
                                                    </div>
                                                );
                                            }) : <div className="text-muted small">{t("No path data yet")}</div>}
                                        </Card.Body>
                                    </Card>
                                </Col>

                                <Col lg={4}>
                                    <Card className="rounded-3 h-100 shadow-sm" role="region"
                                        aria-label="Top referrers today">
                                        <Card.Body>
                                            <Card.Title>{t("Top Referrers Today")}</Card.Title>
                                            {topRefs.length ? topRefs.slice(0, 6).map(([ref, c]) => {
                                                const max = topRefs[0]?.[1] || 1;
                                                const percent = Math.round((c / max) * 100);
                                                return (
                                                    <div key={ref} className="mb-2">
                                                        <div className="d-flex justify-content-between small">
                                                            <span>{ref}</span>
                                                            <span className="text-muted">{c}</span>
                                                        </div>
                                                        <ProgressBar now={percent} variant="success" visuallyHidden />
                                                    </div>
                                                );
                                            }) : <div className="text-muted small">{t("No referrer data yet")}</div>}
                                        </Card.Body>
                                    </Card>
                                </Col>
                            </Row>

                            {/* Recent visits modal for full list */}
                            <Modal show={showRecentModal} onHide={() => setShowRecentModal(false)} size="xl" centered>
                                <Modal.Header closeButton>
                                    <Modal.Title>{t("Recent Visits")}</Modal.Title>
                                </Modal.Header>
                                <Modal.Body>
                                    {recentVisits.length ? (
                                        <Table hover responsive size="sm" className="mb-3" style={{ tableLayout: "fixed" }}>
                                            <colgroup>
                                                <col style={{ width: "18%" }} />
                                                <col style={{ width: "32%" }} />
                                                <col style={{ width: "25%" }} />
                                                <col style={{ width: "25%" }} />
                                            </colgroup>
                                            <thead>
                                                <tr>
                                                    <th>{t("Time")}</th>
                                                    <th>{t("Path")}</th>
                                                    <th>{t("Visitor")}</th>
                                                    <th>{t("IP Address")}</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {pagedRecent.map((v, idx) => (
                                                    <tr key={`${recentPage}-${idx}-${v.ts}-${v.path}`}>
                                                        <td className="text-muted small">{formatDate(v.ts)}</td>
                                                        <td className="text-monospace small text-truncate" title={v.path}>{v.path}</td>
                                                        <td className="small text-muted text-truncate" title={v.visitor_hint}>{v.visitor_hint}</td>
                                                        <td className="small text-muted">
                                                            <span className="d-inline-block text-truncate" style={{ maxWidth: "100%" }} title={renderIpWithFlag(v.ip_mask)}>
                                                                {renderIpWithFlag(v.ip_mask)}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </Table>
                                    ) : <div className="text-muted small">{t("No recent visits yet")}</div>}
                                </Modal.Body>
                                <Modal.Footer className="d-flex justify-content-between align-items-center">
                                    <div className="text-muted small">
                                        {t("Page")} {recentPage} / {totalRecentPages}
                                    </div>
                                    <div className="d-flex gap-2">
                                        <Button
                                            variant="outline-primary"
                                            size="sm"
                                            onClick={() => setRecentPage((p) => Math.max(1, p - 1))}
                                            disabled={recentPage === 1}
                                        >
                                            {t("Previous")}
                                        </Button>
                                        <Button
                                            variant="outline-primary"
                                            size="sm"
                                            onClick={() => setRecentPage((p) => Math.min(totalRecentPages, p + 1))}
                                            disabled={recentPage >= totalRecentPages}
                                        >
                                            {t("Next")}
                                        </Button>
                                        <Button variant="secondary" size="sm" onClick={() => setShowRecentModal(false)}>
                                            {t("Close")}
                                        </Button>
                                    </div>
                                </Modal.Footer>
                            </Modal>

                            <Row className="g-4 mb-4">
                                <Col lg={6}>
                                    <Card className="rounded-3 h-100 shadow-sm" role="region"
                                        aria-label="Recent visits">
                                        <Card.Body>
                                            <Card.Title>{t("Recent Visits")}</Card.Title>
                                            {recentVisits.length ? (
                                                <>
                                                    <Table hover responsive size="sm" className="mb-2">
                                                        <thead>
                                                            <tr>
                                                                <th>{t("Time")}</th>
                                                                <th>{t("Path")}</th>
                                                                <th>{t("Visitor")}</th>
                                                                <th>{t("IP Address")}</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {recentPreview.map((v) => (
                                                                <tr key={`${v.ts}-${v.path}`}>
                                                                    <td className="text-muted small">{formatDate(v.ts)}</td>
                                                                    <td className="text-monospace small">{v.path}</td>
                                                                    <td className="small text-muted">{v.visitor_hint}</td>
                                                                    <td className="small text-muted">
                                                                        <span className="d-inline-block text-truncate" style={{ maxWidth: "100%" }}>
                                                                            {renderIpWithFlag(v.ip_mask)}
                                                                        </span>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </Table>
                                                    <div className="d-flex justify-content-end">
                                                        <Button variant="outline-primary" size="sm" onClick={() => setShowRecentModal(true)}>
                                                            {t("View all")}
                                                        </Button>
                                                    </div>
                                                </>
                                            ) : <div className="text-muted small">{t("No recent visits yet")}</div>}
                                        </Card.Body>
                                    </Card>
                                </Col>

                                <Col lg={6}>
                                    <Card className="rounded-3 h-100 shadow-sm" role="region"
                                        aria-label="Daily rollup">
                                        <Card.Body>
                                            <Card.Title>{t("Last 14 Days")}</Card.Title>
                                            {rollups.length ? (
                                                <Table hover responsive size="sm" className="mb-0">
                                                    <thead>
                                                        <tr>
                                                            <th>{t("Day")}</th>
                                                            <th>{t("Page Views")}</th>
                                                            <th>{t("Unique Visitors")}</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {rollups.slice(0, 14).map((r) => (
                                                            <tr key={r.day}>
                                                                <td className="text-muted small">{r.day}</td>
                                                                <td>{r.pageviews}</td>
                                                                <td>{r.visitors}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </Table>
                                            ) : <div className="text-muted small">{t("No rollup data yet")}</div>}
                                        </Card.Body>
                                    </Card>
                                </Col>
                            </Row>

                            <Row className="g-4 mb-4">
                                <Col>
                                    <Card className="rounded-3 shadow-sm" role="region" aria-label="User snapshot">
                                        <Card.Body>
                                            <Card.Title>{t("User Snapshot")}</Card.Title>
                                            {totalUsers ? (
                                                <div className="d-flex flex-column gap-3">
                                                    <div>
                                                        <div className="text-muted small mb-1">{t("Roles")}</div>
                                                        {Object.entries(roleSummary).map(([role, count]) => {
                                                            const percent = Math.round((count / totalUsers) * 100);
                                                            return (
                                                                <div key={role} className="mb-2">
                                                                    <div className="d-flex justify-content-between small">
                                                                        <span>{role}</span>
                                                                        <span className="text-muted">{count}</span>
                                                                    </div>
                                                                    <ProgressBar now={percent} variant="primary" visuallyHidden />
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                    <div>
                                                        <div className="text-muted small mb-1">{t("Status")}</div>
                                                        {Object.entries(statusSummary).map(([status, count]) => (
                                                            <Badge key={status} bg={status === "active" ? "primary" : "secondary"} className="me-2">
                                                                {t(status)}: {count}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </div>
                                            ) : <div className="text-muted small">{t("No users yet")}</div>}
                                        </Card.Body>
                                    </Card>
                                </Col>
                            </Row>

                            <Row>
                                <Col>
                                    <Card className="rounded-3 shadow-sm" ref={tableRef}>
                                        <Card.Body>
                                            <Card.Title>{t("All Users")}</Card.Title>

                                            {users && users.length > 0 ? (
                                                <Table hover responsive className="mb-0">
                                                    <thead>
                                                        <tr>
                                                            <th>{t("UUID")}</th>
                                                            <th>{t("Email")}</th>
                                                            <th>{t("Name")}</th>
                                                            <th>{t("Role")}</th>
                                                            <th>{t("Status")}</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {users.map((u: UserModel) => (
                                                            <tr key={u.uuid}>
                                                                <td className="text-monospace small">{truncateValue(u.uuid)}</td>
                                                                <td>{u.email}</td>
                                                                <td>{`${u.first_name ?? ""} ${u.last_name ?? ""}`.trim()}</td>
                                                                <td>{userRoleLabels[u.role ?? 0] ?? t("User")}</td>
                                                                <td>{t(u.status)}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </Table>
                                            ) : (
                                                <div className="text-muted">{t("No users found")}</div>
                                            )}

                                            {/* Simple prev/next pagination controls */}
                                            <div className="d-flex justify-content-between align-items-center mt-3">
                                                <Button
                                                    variant="outline-primary"
                                                    onClick={() => { setPage((p) => Math.max(1, p - 1)); scrollToTable(); }}
                                                    disabled={page === 1 || loading}
                                                    aria-label="Previous page"
                                                >
                                                    {t("Previous")}
                                                </Button>

                                                <div className="text-muted">{t("Page")} {page}</div>

                                                <Button
                                                    variant="outline-primary"
                                                    onClick={() => { setPage((p) => p + 1); scrollToTable(); }}
                                                    disabled={!hasMore || loading}
                                                    aria-label="Next page"
                                                >
                                                    {t("Next")}
                                                </Button>
                                            </div>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            </Row>
                        </>
                    )}

                </Container>
            </div>
        </MainLayout>
    );
}
