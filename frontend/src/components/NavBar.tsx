// /StackFusionZiyiliuTop/frontend/src/components/Navbar.tsx
import {Button, Nav, Navbar} from "react-bootstrap";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faSignInAlt, faSignOutAlt, faUser} from "@fortawesome/free-solid-svg-icons";
import AnnotatedText from "@/components/AnnotatedText";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import {themeColours} from "@/styles/theme";
import {useTranslation} from "react-i18next";
import {useAuth} from "@/contexts/useAuth";
import {Link, useLocation} from "react-router-dom";
import {UserRole} from "@/types/User";

export default function NavBar({activePage}: { activePage?: string }) {
    const {user, logout} = useAuth(); // Removed loading from destructuring
    const {t} = useTranslation();
    const location = useLocation();
    // Consider the user to be "on their page" if the pathname (without query or trailing slash)
    // exactly matches `/users/{uuid}`. This guards against trailing slashes or query params.
    const isCurrentUserPage = user ? (() => {
        const raw = location.pathname.split('?')[0];
        return raw.replace(/\/+$/, '') === `/users/${user.uuid}`;
    })() : false;
    // /admin/*
    const isCurrentAdminPage = location.pathname.startsWith('/admin');

    const NavigationItems: Array<{ name: string; path: string; text?: string; textKey?: string }> = [
        {name: "Home", path: "/", text: "ZLiu's"},
        {name: "About Me", path: "/about-me", textKey: "About Me"},
        {name: "Contact", path: "/contact", textKey: "Contact"},
        {name: "Blog", path: "/blog", textKey: "Blog"},
    ];

    return (
        <Navbar expand="sm" className="navbar-custom" style={{zIndex: 100}}>
            <div className="container">
                <Navbar.Toggle aria-controls="mainNavbarNav"/>
                <Navbar.Collapse id="mainNavbarNav">
                    <Nav className="me-auto">
                        {NavigationItems.map((it) => (
                            <Nav.Link
                                key={it.name}
                                href={it.path}
                                className={`d-flex justify-content-center main-navbar-item ${
                                    activePage === it.name ? "active" : ""
                                }`}
                            >
                                <AnnotatedText
                                    text={String(it.text ?? t(it.textKey ?? ""))}
                                    show={activePage === it.name}
                                    color={themeColours.quinary}
                                />
                            </Nav.Link>
                        ))}
                    </Nav>

                    {/* right-hand side */}
                    <div className="ms-auto d-flex justify-content-center align-items-center">
                        {user ? (
                            <>
                                {/* User profile button: render a non-clickable element when already on the user's page */}
                                {isCurrentUserPage ? (
                                    <span
                                        className="btn btn-outline-primary mx-auto me-md-2 disabled"
                                        aria-label="Account"
                                        title={`${user?.first_name} ${user?.last_name}`}
                                        aria-disabled="true"
                                        role="button"
                                        tabIndex={-1}
                                    >
                                        <FontAwesomeIcon icon={faUser}/>
                                        <span className="d-none d-md-inline ms-1">{String(user?.first_name)}</span>
                                    </span>
                                ) : (
                                    <Link
                                        to={`/users/${user.uuid}`}
                                        className="btn btn-outline-primary mx-auto me-md-2"
                                        aria-label="Account"
                                        title={`${user.first_name} ${user.last_name}`}
                                    >
                                        <FontAwesomeIcon icon={faUser}/>
                                        <span className="d-none d-md-inline ms-1">{String(user.first_name)}</span>
                                    </Link>
                                )}

                                {/* Admin button shown only to admin users */}
                                {user.role === UserRole.ADMIN && (isCurrentAdminPage ? (
                                    <Link
                                        to="/admin"
                                        className="btn btn-outline-secondary mx-auto me-md-2 disabled"
                                        aria-label="Admin"
                                        title="Admin"
                                    >Admin</Link>
                                ) : (
                                    <Link
                                        to="/admin"
                                        className="btn btn-outline-secondary mx-auto me-md-2"
                                        aria-label="Admin"
                                        title="Admin"
                                    >Admin</Link>
                                ))}

                                <Button
                                    variant="outline-danger"
                                    className="mx-auto me-md-2"
                                    onClick={logout}
                                    aria-label="Log out"
                                    title="Log out"
                                >
                                    <FontAwesomeIcon icon={faSignOutAlt}/>
                                </Button>
                            </>
                        ) : (
                            <Link
                                to="/auth"
                                className="btn btn-outline-success mx-auto me-md-2"
                                aria-label="Sign in"
                                title="Sign in"
                            >
                                <FontAwesomeIcon icon={faSignInAlt}/>
                                <span className="d-none d-md-inline ms-1">{String(t("Sign in"))}</span>
                            </Link>
                        )}
                        <LanguageSwitcher/>
                    </div>
                </Navbar.Collapse>
            </div>
        </Navbar>
    );
}