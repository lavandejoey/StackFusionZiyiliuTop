// /StackFusionZiyiliuTop/frontend/src/pages/Admin.tsx
import {useEffect, useState} from "react";
import {Container, Row, Col, Card, Table, Spinner, Alert, Button} from "react-bootstrap";
import {fetchAnalyticsBriefing} from "@/services/analyticsService";
import {type BriefingData} from "@/services/axios";
import {getUserRoles, listAllUsers} from "@/services/userService";
import {UserRole} from "@/types/User";
import {useTranslation} from "react-i18next";
import PageHead from "@/components/PageHead";
import MainLayout from "@/components/MainLayout";

export default function AdminPage() {
    const {t} = useTranslation();
    const [brief, setBrief] = useState<BriefingData | null>(null);
    const [users, setUsers] = useState<any[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    // pagination state: default pageSize 10 as requested
    const [page, setPage] = useState<number>(1);
    const pageSize = 10;
    const [hasMore, setHasMore] = useState<boolean>(false);

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

                const usersWithRoles = await Promise.all((rawUsers ?? []).map(async (u: any) => {
                    try {
                        const roles = await getUserRoles(u.uuid);
                        return {...u, role: roles?.[0] ?? null};
                    } catch (e) {
                        console.warn(`Failed to fetch roles for user ${u.uuid}:`, e);
                        return {...u, role: null};
                    }
                }));

                if (!mounted) return;
                setUsers(usersWithRoles);
                // If backend returned exactly pageSize items, there may be more pages.
                setHasMore((rawUsers ?? []).length === pageSize);
            } catch (e: any) {
                if (!mounted) return;
                console.error("Admin page load failed", e);
                setError(e?.message ?? String(e));
            } finally {
                if (!mounted) return;
                setLoading(false);
            }
        })();

        return () => {
            mounted = false;
        };
    }, [page]);

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
                            <Spinner animation="border" role="status"/>
                        </div>
                    ) : (
                        <>
                            <Row className="g-4 mb-4">
                                <Col md={6}>
                                    <Card className="rounded-3 h-100 shadow-sm" role="region"
                                          aria-label="Visitor statistics">
                                        <Card.Body>
                                            <Card.Title>{t("Visitor Info")}</Card.Title>
                                            {brief ? (
                                                <div>
                                                    <div className="d-flex justify-content-between mb-2">
                                                        <div>
                                                            <div
                                                                className="text-muted small">{t("Today Page Views")}</div>
                                                            <div className="fs-4">{brief.pv_today}</div>
                                                        </div>
                                                        <div>
                                                            <div
                                                                className="text-muted small">{t("Today Unique Visitors")}</div>
                                                            <div className="fs-4">{brief.uv_today}</div>
                                                        </div>
                                                    </div>

                                                    <hr/>

                                                    <div className="d-flex justify-content-between">
                                                        <div>
                                                            <div className="text-muted small">{t("7d Page Views")}</div>
                                                            <div className="fs-6">{brief.pv_7d}</div>
                                                        </div>
                                                        <div>
                                                            <div
                                                                className="text-muted small">{t("7d Unique Visitors")}</div>
                                                            <div className="fs-6">{brief.uv_7d}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-muted">{t("No analytics data available")}</div>
                                            )}
                                        </Card.Body>
                                    </Card>
                                </Col>

                                <Col md={6}>
                                    <Card className="rounded-3 h-100 shadow-sm" role="region"
                                          aria-label="Overall visitor info">
                                        <Card.Body>
                                            <Card.Title>{t("Overall Visitor Info")}</Card.Title>
                                            <div
                                                className="text-muted">{t("This panel can show more aggregated metrics or charts in the future.")}</div>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            </Row>

                            <Row>
                                <Col>
                                    <Card className="rounded-3 shadow-sm">
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
                                                    {users.map((u: any) => (
                                                        <tr key={u.uuid}>
                                                            <td className="text-monospace small">{u.uuid}</td>
                                                            <td>{u.email}</td>
                                                            <td>{`${u.first_name ?? ""} ${u.last_name ?? ""}`.trim()}</td>
                                                            <td>{u.role === UserRole.ADMIN ? "Admin" : (u.role === UserRole.USER_MANAGER ? "Manager" : (u.role === UserRole.USER_FRIEND ? "Friend" : "User"))}</td>
                                                            <td>{u.status}</td>
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
                                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                                    disabled={page === 1 || loading}
                                                    aria-label="Previous page"
                                                >
                                                    {t("Previous")}
                                                </Button>

                                                <div className="text-muted">{t("Page")} {page}</div>

                                                <Button
                                                    variant="outline-primary"
                                                    onClick={() => setPage((p) => p + 1)}
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
