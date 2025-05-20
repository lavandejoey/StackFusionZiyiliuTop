// /StackFusionZiyiliuTop/frontend/src/pages/Auth.tsx
import {Container, Row, Col} from "react-bootstrap";
import PageHead from "@/components/PageHead";
import {AuthForm} from "@/components/AuthForm";
import MainLayout from "@/components/MainLayout";

export default function AuthPage() {
    return (
        <MainLayout>
            <PageHead title="Authentication" description="Log in or sign up"/>
            <Container fluid className="d-flex align-items-center" style={{minHeight: "75vh"}}>
                <Row className="flex-grow-1 justify-content-center">
                    <Col xs={12} sm={10} md={7} lg={5} xl={4}>
                        <AuthForm/>
                    </Col>
                </Row>
            </Container>
        </MainLayout>
    );
}
