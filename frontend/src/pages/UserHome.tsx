// src/pages/UserHome.tsx
import {useEffect, useState} from "react";
import {useNavigate, useParams} from "react-router-dom";
import {getUserByUuid} from "@/services/userService";
import MainLayout from "@/components/MainLayout";
import PageHead from "@/components/PageHead";
import {Button, Col, Container, Row, Spinner} from "react-bootstrap";
import {useAuth} from "@/contexts/useAuth";
import type {UserModel} from "@/types/User.ts";

export default function UserHome() {
    const {uuid} = useParams<{ uuid: string }>();
    const {logout} = useAuth();
    const navigate = useNavigate();
    const [user, setUser] = useState<UserModel | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!uuid) {
            navigate("/auth", {replace: true});
            return;
        }

        const fetchUser = async () => {
            try {
                const userData = await getUserByUuid(uuid);
                setUser(userData);
            } catch (error) {
                console.error("Failed to fetch user data", error);
                navigate("/auth", {replace: true});
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, [uuid, navigate]);

    if (loading) {
        return (
            <MainLayout>
                <Container className="d-flex justify-content-center align-items-center" style={{minHeight: "75vh"}}>
                    <Spinner animation="border" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </Spinner>
                </Container>
            </MainLayout>
        );
    }

    if (!user) {
        return (
            <MainLayout>
                <Container className="text-center py-5">
                    <h2>Could not load profile</h2>
                    <p>There was an issue retrieving the user profile. Please try again later.</p>
                    <Button onClick={() => navigate("/")}>Go to Homepage</Button>
                </Container>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <PageHead title={`User: ${user.first_name}`} description={`Profile page for ${user.first_name}`}/>
            <Container className="d-flex align-items-center" style={{minHeight: "75vh"}}>
                <Row className="flex-grow-1 justify-content-center text-center gy-3">
                    <Col xs={12}>
                        <h1>Welcome, {user.first_name ?? user.email}!</h1>
                    </Col>
                    <Col xs={12}>
                        <p className="mb-1"><strong>UUID:</strong> {user.uuid}</p>
                        <p className="mb-1"><strong>Status:</strong> {user.status}</p>
                        <p className="mb-1"><strong>Member
                            since:</strong> {new Date(user.created_at).toLocaleDateString()}</p>
                    </Col>
                    <Col md={4}>
                        <Button onClick={logout} variant={"secondary"} className="w-100">Log out</Button>
                    </Col>
                </Row>
            </Container>
        </MainLayout>
    );
}
