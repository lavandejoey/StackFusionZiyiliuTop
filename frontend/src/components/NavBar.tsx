// /StackFusionZiyiliuTop/frontend/src/components/Navbar.tsx
import {Navbar, Nav, Button} from "react-bootstrap";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faSignOutAlt, faUser} from "@fortawesome/free-solid-svg-icons";
import AnnotatedText from "@/components/AnnotatedText";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import {themeColours} from "@/styles/theme";
import {useTranslation} from "react-i18next";
import {useAuth} from "@/hooks/useAuth";

export default function NavBar({activePage}: { activePage?: string }) {
    const {user, logout} = useAuth();
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
                    <div className="ms-auto d-flex justify-content-center">
                        {user && (
                            <>
                                <Button variant="outline-primary" className="mx-auto me-md-4"
                                        href={`/user/${user.uuid}`}
                                        aria-label="Account"
                                >
                                    <FontAwesomeIcon icon={faUser}/>
                                </Button>
                                <Button variant="outline-danger" className="mx-auto me-md-4" onClick={logout}
                                        aria-label="Log out">
                                    <FontAwesomeIcon icon={faSignOutAlt}/>
                                </Button>
                            </>
                        )}
                        <LanguageSwitcher/>
                    </div>
                </Navbar.Collapse>
            </div>
        </Navbar>
    );
}