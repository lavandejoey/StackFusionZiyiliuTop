// /StackFusionZiyiliuTop/frontend/src/pages/UserHome.tsx
import {useEffect, useState} from "react";
import {Navigate} from "react-router-dom";
import {Card, Container, Spinner} from "react-bootstrap";
import PageHead from "@/components/PageHead";
import MainLayout from "@/components/MainLayout";
import {useAuth} from "@/hooks/useAuth";

export default function UserHome() {
    const {user, refresh} = useAuth();
    const [loading, setLoading] = useState(!user);

    useEffect(() => {
        if (!user) refresh().finally(() => setLoading(false));
    }, [user]);

    if (loading)
        return (
            <MainLayout>
                <Container className="d-flex justify-content-center py-5">
                    <Spinner animation="border" role="status"/>
                </Container>
            </MainLayout>
        );

    if (!user) return <Navigate to="/auth" replace/>;

    const fullName = `${user.first_name} ${user.last_name}`.trim() || user.email;

    return (
        <MainLayout>
            <PageHead
                title={`Welcome, ${fullName}`}
                description="Your personal dashboard"
            />
            <Container className="mt-5 pt-4">
                <Card className="shadow-sm">
                    <Card.Body>
                        <Card.Title as="h2" className="h4">
                            Hello, {fullName}!
                        </Card.Title>
                        <Card.Text className="mb-1">
                            <strong>Email:</strong> {user.email}
                        </Card.Text>
                        <Card.Text className="mb-1">
                            <strong>Member since:</strong>{" "}
                            {new Date(user.created_at).toLocaleDateString()}
                        </Card.Text>
                        <Card.Text className="mb-0">
                            <strong>Roles:</strong> {user.roles.join(", ")}
                        </Card.Text>
                    </Card.Body>
                </Card>
            </Container>
        </MainLayout>
    );
}
