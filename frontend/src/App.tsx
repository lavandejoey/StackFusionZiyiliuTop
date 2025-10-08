// /StackFusionZiyiliuTop/frontend/src/App.tsx
import {Navigate, Outlet, Route, Routes, useLocation} from "react-router-dom";
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
import AdminPage from "@/pages/Admin";
import {UserRole} from "@/types/User";

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

function RequireAdmin() {
    const {user, loading} = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <Container className="d-flex justify-content-center py-5">
                <Spinner animation="border" role="status"/>
            </Container>
        );
    }

    // Not logged in -> to auth; logged in but not admin -> to home
    if (!user) {
        return <Navigate to="/auth" replace state={{from: location}}/>;
    }

    if (user.role !== UserRole.ADMIN) {
        return <Navigate to="/" replace />;
    }

    return <Outlet/>;
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
                <Route path="/blog/:id" element={<BlogPost/>}/>

                {/* protected routes */}
                <Route element={<RequireAuth/>}>
                    <Route path="/users/:uuid" element={<UserHome/>}/>
                </Route>

                {/* admin protected route */}
                <Route element={<RequireAdmin/>}>
                    <Route path="/admin" element={<AdminPage/>} />
                </Route>

                {/* fallback */}
                <Route path="*" element={<Navigate to="/" replace/>}/>
            </Routes>
        </AuthProvider>
    );
}
