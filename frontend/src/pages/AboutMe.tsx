// /StackFusionZiyiliuTop/frontend/src/pages/AboutMe.tsx
import React, {useEffect} from "react";
import {useTranslation} from "react-i18next";
import {Col, Container, Row} from "react-bootstrap";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {
    IconDefinition,
    faEnvelope, faPhone, faCalendarAlt, faMapMarkerAlt, faBook, faCircle, faBriefcase
} from "@fortawesome/free-solid-svg-icons";
import {cvData as cv} from "@/assets/cvData.ts";
import PageHead from "@/components/PageHead";
import MainLayout from "@/components/MainLayout";

// Create a line between two elements (icon and circle) in the timeline.
const createLineBetweenElements = (
    iconElement: HTMLElement, circleElement: HTMLElement, svgElement: SVGSVGElement
) => {
    const iconRect = iconElement.getBoundingClientRect();
    const circleRect = circleElement.getBoundingClientRect();
    const svgRect = svgElement.getBoundingClientRect();

    // Calculate vertical positions relative to the SVG container
    const iconBottomY = iconRect.bottom - svgRect.top;
    const circleCenterY = circleRect.top + circleRect.height / 2 - svgRect.top;
    const circleX = circleRect.left + circleRect.width / 2 - svgRect.left;

    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", String(circleX));
    line.setAttribute("x2", String(circleX));
    line.setAttribute("y1", String(iconBottomY));
    line.setAttribute("y2", String(circleCenterY));
    line.setAttribute("stroke", "gray");
    line.setAttribute("stroke-width", "1");

    svgElement.appendChild(line);
};

// Process timeline for either large or small screens.
const processTimeline = ({bookIcon, internIcon, educationCircles, internshipCircles, svg}: {
    bookIcon: HTMLElement | null; internIcon: HTMLElement | null;
    educationCircles: NodeListOf<HTMLElement>; internshipCircles: NodeListOf<HTMLElement>;
    svg: SVGSVGElement | null;
}) => {
    if (!bookIcon || educationCircles.length === 0 || !internIcon || internshipCircles.length === 0 || !svg) {
        console.error("Required timeline elements not found.");
        return;
    }
    // Draw a line from the bottom of the icon to the last circle of each timeline.
    createLineBetweenElements(bookIcon, educationCircles[educationCircles.length - 1], svg);
    createLineBetweenElements(internIcon, internshipCircles[internshipCircles.length - 1], svg);
};

interface InfoItem {
    logoSrc: string;
    logoAlt: string;
    logoTitle: string;
    institution: string;
    start: string;
    end: string;
    location: string;
    titles: string[];
}

interface InfoSectionProps {
    title: string;
    icon: IconDefinition;
    data: InfoItem[];
    circleId: string;
    logoClass: string;
    t: (key: string) => string;
}

const InfoSection: React.FC<InfoSectionProps> = ({title, icon, data, circleId, logoClass, t}) => {
    // Determine the correct icon id based on title and circleId suffix.
    const iconId =
        title === "Education"
            ? (circleId.includes("lg") ? "book-icon-lg" : "book-icon-sm")
            : (circleId.includes("lg") ? "briefcase-icon-lg" : "briefcase-icon-sm");

    return (
        <Container>
            {/* Short thick line */}
            <hr className="w-25 bg-primary"/>
            <Container className="w-25 mx-0 my-3 p-0 pe-2 d-flex justify-content-between align-items-center">
                <FontAwesomeIcon
                    id={iconId}
                    className="d-flex justify-content-center align-items-center"
                    icon={icon}
                    size="2xl"
                    style={{zIndex: 99}}
                />
                <h2 className="mb-1 mx-3 p-0 text-nowrap">{t(title)}</h2>
            </Container>
            {data.map((item, index) => (
                <Container key={index} className="mb-3">
                    <Row className="mb-2">
                        <Col xs={{span: "auto", offset: 1}}
                             className="d-flex justify-content-center align-items-center d-none d-sm-block">
                            <img
                                className={`m-0 p-0 ${logoClass}`}
                                src={item.logoSrc}
                                alt={item.logoAlt}
                                title={item.logoTitle}
                                style={{width: "30px", height: "30px", marginRight: "10px"}}
                            />
                        </Col>
                        <Col xs={{span: "auto"}} className="m-0 p-0 d-flex align-items-center">
                            <strong className="m-0">{item.institution}</strong>
                        </Col>
                    </Row>
                    <Row>
                        <Col xs={{span: 1}}
                             className="d-flex justify-content-start align-items-center d-none d-sm-block">
                            <FontAwesomeIcon icon={faCircle} size="2xs" className={circleId} style={{zIndex: 99}}/>
                        </Col>
                        <Col xs={{span: 12}} md={{span: 10}} xl={{span: 8}}
                             className="d-sm-flex justify-content-between align-items-center">
                            <p className="m-0 text-muted">
                                {item.start} – {item.end}
                            </p>
                            <p className="m-0 text-muted">
                                <FontAwesomeIcon icon={faMapMarkerAlt}/>&nbsp; {item.location}
                            </p>
                        </Col>
                    </Row>
                    <Row>
                        <Col xs={{span: 12}} sm={{span: 10, offset: 1}}>
                            {item.titles.map((title: string, idx: number) => (
                                <p key={idx} className="m-0">{title}</p>
                            ))}
                        </Col>
                    </Row>
                </Container>
            ))}
        </Container>
    );
};

// Adjust the width of fixed container and dynamic content based on available space.
const adjustFixedContainerWidth = () => {
    const parentElement = document.querySelector('.d-none.d-lg-block');
    const leftSidebar = document.querySelector('.fixed-container');
    const rightContent = document.querySelector('.dynamic-content-container');

    if (parentElement && leftSidebar && rightContent) {
        const parentWidth = parentElement.clientWidth;
        const style = getComputedStyle(parentElement);
        const padding = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
        const availableWidth = parentWidth - padding;

        // Calculate sidebar width (between 250 and 400px) and gap (up to 50px)
        const sidebarWidth = Math.min(400, Math.max(250, availableWidth * 0.2));
        const gap = Math.min(50, availableWidth * 0.05);
        const rightWidth = availableWidth - sidebarWidth - gap;

        (rightContent as HTMLElement).style.width = `${rightWidth}px`;
        (rightContent as HTMLElement).style.marginLeft = `${sidebarWidth + gap}px`;
        (leftSidebar as HTMLElement).style.width = `${sidebarWidth}px`;
    } else {
        console.error("Required layout elements not found.");
    }
};

// AboutMe component
const AboutMe: React.FC = () => {
    const {t} = useTranslation();
    const cvData = cv(t);
    const contactFields: [string, IconDefinition, string | null][] = [
        ["email", faEnvelope, "mailto:"], ["phone", faPhone, "tel:"],
        ["birthday", faCalendarAlt, null], ["location", faMapMarkerAlt, null],
    ];

    useEffect(() => {
        // Adjust container widths immediately
        adjustFixedContainerWidth();

        // Function to process both large and small timeline layouts.
        const processAllTimelines = () => {
            // Process large screen timeline
            processTimeline({
                bookIcon: document.querySelector("#book-icon-lg"),
                internIcon: document.querySelector("#briefcase-icon-lg"),
                educationCircles: document.querySelectorAll(".education-circle-lg") as NodeListOf<HTMLElement>,
                internshipCircles: document.querySelectorAll(".internship-circle-lg") as NodeListOf<HTMLElement>,
                svg: document.querySelector("#timeline-line-lg") as SVGSVGElement | null,
            });
            // Process small screen timeline
            // processTimeline({
            //     bookIcon: document.querySelector("#book-icon-sm"),
            //     internIcon: document.querySelector("#briefcase-icon-sm"),
            //     educationCircles: document.querySelectorAll(".education-circle-sm") as NodeListOf<HTMLElement>,
            //     internshipCircles: document.querySelectorAll(".internship-circle-sm") as NodeListOf<HTMLElement>,
            //     svg: document.querySelector("#timeline-line-sm") as SVGSVGElement | null,
            // });
        };

        // Run timeline processing after the component mounts.
        document.addEventListener("DOMContentLoaded", processAllTimelines);
        processAllTimelines();

        // On window resize, adjust layout and redraw timeline lines.
        const handleResize = () => {
            adjustFixedContainerWidth();
            const svg = document.querySelector("#timeline-line-lg") || document.querySelector("#timeline-line-sm");
            if (svg) {
                while (svg.lastChild) {
                    svg.removeChild(svg.lastChild);
                }
                processTimeline({
                    bookIcon: document.querySelector("#book-icon-lg"),
                    internIcon: document.querySelector("#briefcase-icon-lg"),
                    educationCircles: document.querySelectorAll(".education-circle-lg") as NodeListOf<HTMLElement>,
                    internshipCircles: document.querySelectorAll(".internship-circle-lg") as NodeListOf<HTMLElement>,
                    svg: svg as SVGSVGElement | null,
                });
                // processTimeline({
                //     bookIcon: document.querySelector("#book-icon-sm"),
                //     internIcon: document.querySelector("#briefcase-icon-sm"),
                //     educationCircles: document.querySelectorAll(".education-circle-sm") as NodeListOf<HTMLElement>,
                //     internshipCircles: document.querySelectorAll(".internship-circle-sm") as NodeListOf<HTMLElement>,
                //     svg: document.querySelector("#timeline-line-sm") as SVGSVGElement | null,
                // });
            } else {
                console.error("SVG element not found on resize.");
            }
        };

        window.addEventListener('resize', handleResize);

        // Cleanup event listeners on component unmount.
        return () => {
            window.removeEventListener('resize', handleResize);
            document.removeEventListener("DOMContentLoaded", processAllTimelines);
        };
    }, []);

    // --- Render the AboutMe page content ---
    return (
        <MainLayout activePage={t("About Me")}>
            <PageHead
                title={t("About LIU Ziyi - AI Researcher at Institut Polytechnique de Paris")}
                description="Learn about LIU Ziyi. Expertise in Machine Learning, Computer Vision, Trustworthy AI, and more."
            />
            {/* Desktop View */}
            <div className="d-none d-lg-block m-5 px-5">
                {/*Left sidebar*/}
                <Container
                    className="py-3 position-fixed fixed-container rounded-5 bg-white bg-opacity-0 border border-primary"
                >
                    <Container className="d-flex flex-wrap align-content-around">
                        <Container className={"my-5 d-flex justify-content-center align-items-center"}>
                            <img className={"rounded-4"} src={cvData.contact.portraitSrc}
                                 alt={cvData.contact.portraitAlt}
                                 style={{scale: 1.2, objectFit: "cover", width: "120px", height: "120px"}}
                            />
                        </Container>
                        <Container className={"d-flex flex-column justify-content-center align-items-center"}>
                            <h1 title={cvData.contact.name}>{cvData.contact.name}</h1>
                            <p className={"my-0 py-0"}>{cvData.contact.title}</p>
                        </Container>
                    </Container>
                    <Container className="d-flex justify-content-center align-items-center">
                        <hr className="w-75"/>
                    </Container>
                    <Container className="d-flex justify-content-center align-items-center">
                        <ul className="container m-auto p-auto">
                            {contactFields.map((field, index) => {
                                const [key, iconClass, hrefPrefix] = field;
                                const value = cvData.contact[key as keyof typeof cvData.contact];
                                return (
                                    <li key={index} className="row my-4">
                                        <div className="col-3 d-flex justify-content-center align-items-center">
                                            <FontAwesomeIcon icon={iconClass}/>
                                        </div>
                                        <div className="col-9">
                                            <p className={`my-0 text-start ${key === "location" ? "" : "text-truncate"}`}>
                                                {hrefPrefix ? (
                                                    <a className="contact-link" href={hrefPrefix + value}
                                                       style={{textDecoration: "none"}}>
                                                        {value}
                                                    </a>
                                                ) : (value)}
                                            </p>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    </Container>
                </Container>
                {/* Right Content */}
                <svg id="timeline-line-lg"
                     style={{
                         position: "absolute", width: "100%", height: "100%",
                         top: 0, left: 0, zIndex: 1, pointerEvents: "none"
                     }}
                ></svg>
                <Container
                    className="dynamic-content-container px-5 py-4 rounded-5 bg-white bg-opacity-0 border border-primary"
                    style={{zIndex: 0}}
                >
                    <Container>
                        <h2 className="mb-3">{t("About Me")}</h2>
                        <p style={{textAlign: "justify"}}>{cvData.aboutMe1}</p>
                        <p style={{textAlign: "justify"}}>{cvData.aboutMe2}</p>
                    </Container>
                    {/*Education Section*/}
                    <InfoSection
                        title="Education"
                        icon={faBook}
                        data={cvData.educations}
                        circleId="education-circle-lg"
                        logoClass="school-logo"
                        t={t}
                    />
                    {/*Internships Section*/}
                    <InfoSection
                        title="Internships"
                        icon={faBriefcase}
                        data={cvData.internships}
                        circleId="internship-circle-lg"
                        logoClass="company-logo"
                        t={t}
                    />
                </Container>
            </div>
            {/* Mobile View */}
            <div className="d-lg-none my-4 mx-3" style={{position: "relative"}}>
            {/*<div className="d-lg-none my-4 mx-3">*/}
                <Row>
                    {/*Upper content*/}
                    <Container className="rounded-5 bg-white bg-opacity-0 border border-primary px-3 py-4 mt-4">
                        <Row className={"my-2 mx-3"}>
                            <Col xs={{span: 4}} className="d-flex justify-content-center align-items-center">
                                <img className={"rounded-4"} src={cvData.contact.portraitSrc}
                                     alt={cvData.contact.portraitAlt}
                                     style={{scale: 1.2, objectFit: "cover", width: "80px", height: "80px"}}
                                />
                            </Col>
                            <Col xs={{span: 8}}
                                 className="d-flex flex-column justify-content-center align-items-center">
                                <h1 title={cvData.contact.name}>{cvData.contact.name}</h1>
                                <p className={"my-0 py-0"}>{cvData.contact.title}</p>
                            </Col>
                        </Row>
                        <Container className={"d-flex justify-content-center align-items-center"}>
                            <hr className="w-75"/>
                        </Container>
                        <ul className="row d-flex justify-content-between align-items-center m-0 p-0">
                            {contactFields.map((field, index) => {
                                const [key, iconClass, hrefPrefix] = field;
                                const value = cvData.contact[key as keyof typeof cvData.contact];
                                return (
                                    <Col xs={{span: 12}} sm={{span: 6}} key={index} className="my-1">
                                        <Row>
                                            <Col xs={{span: 2}}
                                                 className="d-flex justify-content-center align-items-center">
                                                <FontAwesomeIcon icon={iconClass}/>
                                            </Col>
                                            <Col xs={{span: 10}}>
                                                <p className={`my-0 text-start ${key === "location" ? "" : "text-truncate"}`}>
                                                    {hrefPrefix ? (
                                                        <a className="contact-link" href={hrefPrefix + value}
                                                           style={{textDecoration: "none"}}>
                                                            {value}
                                                        </a>
                                                    ) : (value)}
                                                </p>
                                            </Col>
                                        </Row>
                                    </Col>
                                );
                            })}
                        </ul>
                    </Container>
                    {/*About Me and Sections*/}
                    <svg id="timeline-line-sm"
                         style={{
                             position: "absolute", width: "100%", height: "100%",
                             top: 0, left: 0, zIndex: 1, pointerEvents: "none"
                         }}></svg>
                    <Container
                        className="rounded-5 bg-white bg-opacity-0 border border-primary px-3 py-4 mt-4"
                        style={{zIndex: 0}}
                    >
                        <Container>
                            <h2 className={"mb-3"}>{t("About Me")}</h2>
                            <p style={{textAlign: "justify"}}>{cvData.aboutMe1}</p>
                            <p style={{textAlign: "justify"}}>{cvData.aboutMe2}</p>
                        </Container>
                    </Container>
                    {/*Education Section*/}
                    <InfoSection
                        title="Education"
                        icon={faBook}
                        data={cvData.educations}
                        circleId="education-circle-sm"
                        logoClass="school-logo"
                        t={t}
                    />
                    {/*Internships Section*/}
                    <InfoSection
                        title="Internships"
                        icon={faBriefcase}
                        data={cvData.internships}
                        circleId="internship-circle-sm"
                        logoClass="company-logo"
                        t={t}
                    />
                </Row>
            </div>
        </MainLayout>
    );
};


export default AboutMe;
