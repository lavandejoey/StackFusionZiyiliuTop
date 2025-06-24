// /StackFusionZiyiliuTop/frontend/src/components/Navbar.tsx
import {Button, Nav, Navbar} from "react-bootstrap";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faSignInAlt, faSignOutAlt, faUser} from "@fortawesome/free-solid-svg-icons";
import AnnotatedText from "@/components/AnnotatedText";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import {themeColours} from "@/styles/theme";
import {useTranslation} from "react-i18next";
import {useAuth} from "@/contexts/useAuth";
import {Link} from "react-router-dom";

export default function NavBar({activePage}: { activePage?: string }) {
    const {user, logout} = useAuth(); // Removed loading from destructuring
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
                        {NavigationItems.map((it) => (
                            <Nav.Link
                                key={it.name}
                                href={it.path}
                                className={`d-flex justify-content-center main-navbar-item ${
                                    activePage === it.name ? "active" : ""
                                }`}
                            >
                                <AnnotatedText
                                    text={it.text}
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
                                <Link
                                    to={`/users/${user.uuid}`}
                                    className="btn btn-outline-primary mx-auto me-md-2"
                                    aria-label="Account"
                                    title={`${user.first_name} ${user.last_name}`}
                                >
                                    <FontAwesomeIcon icon={faUser}/>
                                    <span className="d-none d-md-inline ms-1">{user.first_name}</span>
                                </Link>
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
                                <span className="d-none d-md-inline ms-1">{t("Sign in")}</span>
                            </Link>
                        )}
                        <LanguageSwitcher/>
                    </div>
                </Navbar.Collapse>
            </div>
        </Navbar>
    );
}