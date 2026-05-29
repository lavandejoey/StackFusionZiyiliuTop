// /StackFusionZiyiliuTop/frontend/src/components/MainLayout.tsx
import React, {useEffect} from "react";
import {useLocation} from "react-router-dom";
import NavBar from "@/components/NavBar.tsx"
import Alerts from "@/components/Alerts.tsx"
import Footer from "@/components/Footer.tsx"
import {trackVisit} from "@/services/analyticsService.tsx";

interface MainLayoutProps {
    activePage?: string,
    info?: string,
    error?: string,
    success?: string,
    warning?: string,
    children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({activePage, info, error, success, warning, children}) => {
    const location = useLocation();

    useEffect(() => {
        // Track the page visit whenever the pathname changes.
        trackVisit(location.pathname);
    }, [location.pathname]);

    return (
        <>
            <div className={"phoframe user-select-none"}></div>
            <div className={"container-fluid flex-grow-1 d-flex flex-column"}
                 style={{minHeight: "100%", position: "relative"}}>
                <NavBar activePage={activePage}/>
                {info && <Alerts info={info}/>}
                {error && <Alerts error={error}/>}
                {success && <Alerts success={success}/>}
                {warning && <Alerts warning={warning}/>}
                {children}
                <Footer/>
            </div>
        </>
    );
};

export default MainLayout;
