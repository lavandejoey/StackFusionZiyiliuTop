// /StackFusionZiyiliuTop/frontend/src/App.tsx
import {Routes, Route, Navigate, Outlet, useLocation} from "react-router-dom";
import {Container, Spinner} from "react-bootstrap";
import {useAuth} from "@/contexts/useAuth";
import {AuthProvider} from "@/contexts/AuthProvider";
import Home from "@/pages/Home";
import AuthPage from "@/pages/Auth";
import AboutMe from "@/pages/AboutMe";
import Contact from "@/pages/Contact";
import UserHome from "@/pages/UserHome";
import BlogList from "@/pages/BlogList";
import BlogPost from "@/pages/BlogPost";
import ProxyConfig from "@/pages/ProxyConfig";

function RequireAuth() {
    const {user, loading} = useAuth();
    const location = useLocation();

    // wait for /auth/me to resolve
    if (loading) {
        return (
            <Container className="d-flex justify-content-center py-5">
                <Spinner animation="border" role="status"/>
            </Container>
        );
    }
    // if user is not logged in, redirect to /auth
    return user ? <Outlet/> : <Navigate to="/auth" replace state={{from: location}}/>;
}

export default function App() {
    return (
        <AuthProvider>
            <Routes>
                {/* public routes */}
                <Route path="/" element={<Home/>}/>
                <Route path="/about-me" element={<AboutMe/>}/>
                <Route path="/contact" element={<Contact/>}/>
                <Route path="/auth" element={<AuthPage/>}/>
                <Route path="/blog" element={<BlogList/>}/>
                <Route path="/blog/:pageId" element={<BlogPost/>}/>
                {/* proxy config download (no auth) */}
                <Route path="/proxy/config" element={<ProxyConfig/>}/>

                {/* protected routes */}
                <Route element={<RequireAuth/>}>
                    <Route path="/users/:uuid" element={<UserHome/>}/>
                </Route>

                {/* fallback */}
                <Route path="*" element={<Navigate to="/" replace/>}/>
            </Routes>
        </AuthProvider>
    );
}
