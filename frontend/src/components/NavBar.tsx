// /StackFusionZiyiliuTop/frontend/src/components/Navbar.tsx
import React from "react";
import AnnotatedText from "@/components/AnnotatedText";
import {themeColours} from "@/styles/theme.ts";
import LanguageSwitcher from "@/components/LanguageSwitcher.tsx";
import {Navbar, Nav} from 'react-bootstrap';
import {useTranslation} from "react-i18next";

interface NavBarProps {
    activePage?: string;
    user?: { userId?: string };
}

const NavBar: React.FC<NavBarProps> = ({activePage, user}) => {
    const {t} = useTranslation();
    const NavigationItems = [
        {name: "Home", path: "/", text: "ZLiu's"},
        {name: "About Me", path: "/about-me", text: t("About Me")},
        {name: "Contact", path: "/contact", text: t("Contact")},
        {name: "Blog", path: "/blog", text: t("Blog")},
    ];
    return (
        <Navbar expand="sm" className="navbar-custom" style={{zIndex: 100}}>
            <div className="container">
                <Navbar.Toggle aria-controls="mainNavbarNav"/>
                <Navbar.Collapse id="mainNavbarNav">
                    <Nav className="me-auto">
                        {NavigationItems.map(item => (
                            <Nav.Link
                                key={item.name}
                                href={item.path}
                                className={`d-flex justify-content-center main-navbar-item ${activePage === item.name ? "active" : ""}`}
                            >
                                <AnnotatedText text={item.text} show={activePage === item.name}
                                               color={themeColours.quinary}/>
                            </Nav.Link>
                        ))}
                    </Nav>

                    <div className="ms-auto d-flex justify-content-center">
                        {user && user.userId && (
                            <>
                                <a className="btn btn-outline-primary mx-auto me-md-4" href={`/console/${user.userId}`}>
                                    <i className="fas fa-user"></i>
                                </a>
                                <a className="btn btn-outline-danger mx-auto me-md-4" href="/auth/logout">
                                    <i className="fas fa-sign-out-alt"></i>
                                </a>
                            </>
                        )}
                        <LanguageSwitcher/>
                    </div>
                </Navbar.Collapse>
            </div>
        </Navbar>
    );
};

export default NavBar;
