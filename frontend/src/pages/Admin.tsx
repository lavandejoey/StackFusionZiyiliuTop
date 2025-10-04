// /StackFusionZiyiliuTop/frontend/src/pages/admin.tsx
import {useEffect, useState} from "react";
import {Container, Row, Col, Card, Table, Spinner, Alert} from "react-bootstrap";
import {fetchAnalyticsBriefing} from "@/services/analyticsService";
import {UsersAPI, type BriefingData} from "@/services/axios";
import {getUserRoles} from "@/services/userService";
import {UserRole} from "@/types/User";
import {useTranslation} from "react-i18next";

export default function AdminPage() {
    const {t} = useTranslation();
    const [brief, setBrief] = useState<BriefingData | null>(null);
    const [users, setUsers] = useState<any[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            setLoading(true);
            setError(null);
            try {
                const [b, uRes] = await Promise.all([
                    fetchAnalyticsBriefing(),
                    UsersAPI.listAll(),
                ]);

                setBrief(b);
                const rawUsers = (uRes as any).data?.data ?? [];
                // Fetch roles for each user in parallel and attach the first role
                const usersWithRoles = await Promise.all(rawUsers.map(async (u: any) => {
                    try {
                        const roles = await getUserRoles(u.uuid);
                        console.log("Fetched roles for user", u.uuid, roles);
                        return {...u, role: roles?.[0] ?? null};
                    } catch (e) {
                        // If role fetch fails, leave role null but keep user
                        console.warn(`Failed to fetch roles for user ${u.uuid}:`, e);
                        return {...u, role: null};
                    }
                }));

                setUsers(usersWithRoles);
            } catch (e: any) {
                console.error("Admin page load failed", e);
                setError(e?.message ?? String(e));
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    return (
        <Container className="py-4">
            <h2 className="mb-4">{t("Admin Dashboard")}</h2>

            {error && <Alert variant="danger">{error}</Alert>}

            {loading ? (
                <div className="d-flex justify-content-center py-5">
                    <Spinner animation="border" role="status"/>
                </div>
            ) : (
                <>
                    <Row className="g-4 mb-4">
                        <Col md={6}>
                            <Card className="rounded-3 h-100 shadow-sm" role="region" aria-label="Visitor statistics">
                                <Card.Body>
                                    <Card.Title>{t("Visitor Info")}</Card.Title>
                                    {brief ? (
                                        <div>
                                            <div className="d-flex justify-content-between mb-2">
                                                <div>
                                                    <div className="text-muted small">{t("Today PV")}</div>
                                                    <div className="fs-4">{brief.pv_today}</div>
                                                </div>
                                                <div>
                                                    <div className="text-muted small">{t("Today UV")}</div>
                                                    <div className="fs-4">{brief.uv_today}</div>
                                                </div>
                                            </div>

                                            <hr/>

                                            <div className="d-flex justify-content-between">
                                                <div>
                                                    <div className="text-muted small">{t("7d PV")}</div>
                                                    <div className="fs-6">{brief.pv_7d}</div>
                                                </div>
                                                <div>
                                                    <div className="text-muted small">{t("7d UV")}</div>
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
                            <Card className="rounded-3 h-100 shadow-sm" role="region" aria-label="Overall visitor info">
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
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </>
            )}
        </Container>
    );
}
