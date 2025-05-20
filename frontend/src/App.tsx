// /StackFusionZiyiliuTop/frontend/src/App.tsx
import {Routes, Route, Navigate, Outlet} from "react-router-dom";
import Home from "@/pages/Home";
import AboutMe from "@/pages/AboutMe";
import Contact from "@/pages/Contact";
import AuthPage from "@/pages/Auth";
import UserHome from "@/pages/UserHome";
import {AuthProvider, useAuth} from "@/hooks/useAuth";
import {Container, Spinner} from "react-bootstrap";

function RequireAuth() {
    const {user, ready} = useAuth();

    /* show a tiny spinner until the first /user/me finishes */
    if (!ready)
        return (
            <Container className="d-flex justify-content-center py-5">
                <Spinner animation="border" role="status"/>
            </Container>
        );

    return user ? <Outlet/> : <Navigate to="/auth" replace/>;
}

export default function App() {
    return (
        <AuthProvider>
            <Routes>
                <Route path="/" element={<Home/>}/>
                <Route path="/about-me" element={<AboutMe/>}/>
                <Route path="/contact" element={<Contact/>}/>
                <Route path="/auth" element={<AuthPage/>}/>

                {/* protected */}
                <Route element={<RequireAuth/>}>
                    <Route path="/user/:uuid" element={<UserHome/>}/>
                </Route>

                {/* fallback */}
                <Route path="*" element={<Navigate to="/" replace/>}/>
            </Routes>
        </AuthProvider>
    );
}
