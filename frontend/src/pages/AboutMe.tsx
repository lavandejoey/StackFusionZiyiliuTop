// /StackFusionZiyiliuTop/frontend/src/pages/AboutMe.tsx
import React, {useEffect, useLayoutEffect, useState} from "react";
import {useTranslation} from "react-i18next";
import {Col, Container, Row} from "react-bootstrap";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {
    faBook,
    faBriefcase,
    faCalendarAlt,
    faCircle,
    faEnvelope,
    faMapMarkerAlt,
    faPhone,
    type IconDefinition
} from "@fortawesome/free-solid-svg-icons";
import {cvData as cv} from "@/assets/cvData.ts";
import PageHead from "@/components/PageHead";
import MainLayout from "@/components/MainLayout";
import {RepoCard, type RepoProps} from "@/components/RepoCard";
import {fetchRepos} from "@/services/apiService";
import Masonry, {ResponsiveMasonry} from "react-responsive-masonry"

/* =========================
 * Geometry & SVG utilities
 * ========================= */
const getRect = (el: Element | null): DOMRect | null => {
    if (!el) return null;
    const rect = (el as HTMLElement).getBoundingClientRect?.();
    if (!rect) return null;
    if (rect.width === 0 && rect.height === 0) return null;
    const style = window.getComputedStyle(el as Element);
    if (style.visibility === "hidden" || style.display === "none") return null;
    return rect;
};

const sizeOverlaySvg = (svg: SVGSVGElement | null, host: HTMLElement | null) => {
    if (!svg || !host) return;
    // 使用像素尺寸，避免仅有 CSS 百分比导致实际渲染为 0×0 的情况
    svg.setAttribute("width", String(host.clientWidth));
    svg.setAttribute("height", String(host.scrollHeight));
};

const clearSvgLines = (svg: SVGSVGElement | null) => {
    if (!svg) return;
    while (svg.lastChild) svg.removeChild(svg.lastChild);
};

// Create a line between two elements (icon and circle) in the timeline.
const createLineBetweenElements = (
    iconElement: HTMLElement | SVGGraphicsElement,
    circleElement: HTMLElement | SVGGraphicsElement,
    svgElement: SVGSVGElement
) => {
    const iconRect = getRect(iconElement);
    const circleRect = getRect(circleElement);
    const svgRect = getRect(svgElement);

    if (!iconRect || !circleRect || !svgRect) {
        // 尺寸未就绪，跳过
        return;
    }

    // Start point: Bottom-center of the icon
    // const x1 = (iconRect.left + iconRect.width / 2) - svgRect.left;
    const x1 = (circleRect.left + circleRect.width / 2) - svgRect.left;
    const y1 = iconRect.bottom - svgRect.top;

    // End point: Center of the circle
    const x2 = (circleRect.left + circleRect.width / 2) - svgRect.left;
    const y2 = (circleRect.top + circleRect.height / 2) - svgRect.top;

    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", String(x1));
    line.setAttribute("y1", String(y1));
    line.setAttribute("x2", String(x2));
    line.setAttribute("y2", String(y2));
    line.setAttribute("stroke", "gray");
    line.setAttribute("stroke-width", "1");
    line.setAttribute("vector-effect", "non-scaling-stroke"); // 缩放时线宽不变

    svgElement.appendChild(line);
};

// Process timeline section (education or internships) independently
const processTimelineSection = (
    iconElement: (HTMLElement | SVGGraphicsElement | null),
    circles: NodeListOf<HTMLElement | SVGGraphicsElement>,
    svgElement: SVGSVGElement | null,
) => {
    if (!svgElement) return;
    if (!iconElement) return;

    // 过滤不可见/零尺寸的圆点
    const visible = Array.from(circles).filter(c => !!getRect(c));
    if (visible.length === 0) return;

    const lastCircle = visible[visible.length - 1];

    try {
        createLineBetweenElements(iconElement, lastCircle, svgElement);
    } catch (error) {
        console.error("Error creating line between elements:", error);
    }
};

// Process timeline for either large or small screens.
const processTimeline = ({bookIcon, internIcon, educationCircles, internshipCircles, svg}: {
    bookIcon: (HTMLElement | SVGGraphicsElement | null);
    internIcon: (HTMLElement | SVGGraphicsElement | null);
    educationCircles: NodeListOf<HTMLElement | SVGGraphicsElement>;
    internshipCircles: NodeListOf<HTMLElement | SVGGraphicsElement>;
    svg: SVGSVGElement | null;
}) => {
    processTimelineSection(bookIcon, educationCircles, svg);
    processTimelineSection(internIcon, internshipCircles, svg);
};

interface InfoItem {
    logoSrc: string,
    logoAlt: string,
    logoTitle: string,
    institution: string,
    start: string,
    end: string,
    location: string,
    titles: string[];
}

interface InfoSectionProps {
    title: string,
    icon: IconDefinition,
    data: InfoItem[],
    circleId: string,
    logoClass: string,
    sizeSuffix: string,
    t: (key: string) => string,
}

const InfoSection: React.FC<InfoSectionProps> = ({title, icon, data, circleId, logoClass, sizeSuffix, t}) => {
    const iconId = `${circleId === "education-circle" ? "book" : "briefcase"}-icon${sizeSuffix}`;
    const circleClass = `${circleId === "education-circle" ? "education" : "internship"}-circle${sizeSuffix}`;

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
                            <FontAwesomeIcon
                                icon={faCircle}
                                color={"gray"}
                                size="2xs"
                                className={circleClass}
                                style={{zIndex: 99}}
                            />
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
    const rightContentElements = document.querySelectorAll('.dynamic-content-container');

    if (parentElement && leftSidebar && rightContentElements.length > 0) {
        const parentWidth = (parentElement as HTMLElement).clientWidth;
        const style = getComputedStyle(parentElement as Element);
        const padding = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
        const availableWidth = parentWidth - padding;

        // Calculate sidebar width (between 250 and 400px) and gap (up to 50px)
        const sidebarWidth = Math.min(400, Math.max(250, availableWidth * 0.2));
        const gap = Math.min(50, availableWidth * 0.05);
        const rightWidth = availableWidth - sidebarWidth - gap;

        // Apply the calculated width and margin to all right content containers
        rightContentElements.forEach((rightContent) => {
            (rightContent as HTMLElement).style.width = `${rightWidth}px`;
            (rightContent as HTMLElement).style.marginLeft = `${sidebarWidth + gap}px`;
        });
        (leftSidebar as HTMLElement).style.width = `${sidebarWidth}px`;
    } else {
        // console.warn("Required layout elements not found.");
    }
};

// Add a new component for the main content sections
const MainContent: React.FC<{
    t: (key: string) => string;
    cvData: any;
    sizeSuffix: string;
}> = ({t, cvData, sizeSuffix}) => {
    const [repos, setRepos] = useState<RepoProps[]>([]);

    useEffect(() => {
        const loadRepos = async () => {
            try {
                const fetchedRepos = await fetchRepos();
                setRepos(fetchedRepos);
            } catch (error) {
                console.error("Failed to fetch repos:", error);
            }
        };

        loadRepos();
    }, []);

    return (
        <>
            {/* About Me, Education, Internships Container */}
            <Container
                className="px-3 px-lg-5 py-4 rounded-5 bg-white bg-opacity-0 border border-primary mb-4"
                style={{zIndex: 0}}
            >
                <Container>
                    <h2 className="mb-3">{t("About Me")}</h2>
                    {cvData.aboutMes.map((about: string, index: number) => (
                        <p key={index} style={{textAlign: "justify"}}>{about}</p>
                    ))}
                </Container>
                {/*Education Section*/}
                <InfoSection
                    title={t("Education")}
                    icon={faBook}
                    data={cvData.educations}
                    circleId="education-circle"
                    logoClass="school-logo"
                    sizeSuffix={sizeSuffix}
                    t={t}
                />
                {/*Internships Section*/}
                <InfoSection
                    title={t("Internships")}
                    icon={faBriefcase}
                    data={cvData.internships}
                    circleId="internship-circle"
                    logoClass="company-logo"
                    sizeSuffix={sizeSuffix}
                    t={t}
                />
            </Container>

            {/* Portfolio Section */}
            <Container
                className="px-3 px-lg-5 py-4 rounded-5 bg-white bg-opacity-0 border border-primary"
                style={{zIndex: 0}}
            >
                <Container>
                    <h2 className="mb-3">{t("Portfolio")}</h2>
                    <ResponsiveMasonry
                        columnsCountBreakPoints={{350: 1, 1024: 2, 1440: 3}}
                        className="masonry-grid"
                    >
                        <Masonry>
                            {repos.map((repo) => (
                                <RepoCard {...repo} key={repo.url}/>
                            ))}
                        </Masonry>
                    </ResponsiveMasonry>
                </Container>
            </Container>
        </>
    );
};

// Add a new component for the contact sidebar/header
const ContactSection: React.FC<{ cvData: any; contactFields: any[]; isMobile?: boolean }> = ({
                                                                                                 cvData,
                                                                                                 contactFields,
                                                                                                 isMobile = false
                                                                                             }) => {
    return (
        <Container
            className={`${isMobile ?
                'rounded-5 bg-white bg-opacity-0 border border-primary px-3 py-4 mt-4 mb-4' :
                'rounded-5 bg-white bg-opacity-0 border border-primary p-2 position-fixed fixed-container'}`}>
            {isMobile ? (
                // Mobile layout
                <Row className="my-2 mx-3">
                    <Col xs={{span: 4}} className="d-flex justify-content-center align-items-center">
                        <img className="rounded-4" src={cvData.contact.portraitSrc}
                             alt={cvData.contact.portraitAlt}
                             style={{scale: 1.2, objectFit: "cover", width: "80px", height: "80px"}}
                        />
                    </Col>
                    <Col xs={{span: 8}}
                         className="d-flex flex-column justify-content-center align-items-center">
                        <h2 title={cvData.contact.name}>{cvData.contact.name}</h2>
                        <p className="my-0 py-0">{cvData.contact.title}</p>
                    </Col>
                </Row>
            ) : (
                // Desktop layout
                <Container>
                    <Container className="my-5 d-flex justify-content-center align-items-center">
                        <img className="rounded-4" src={cvData.contact.portraitSrc}
                             alt={cvData.contact.portraitAlt}
                             style={{scale: 1.2, objectFit: "cover", width: "120px", height: "120px"}}
                        />
                    </Container>
                    <Container className="text-center mb-3">
                        <h2 title={cvData.contact.name}>{cvData.contact.name}</h2>
                        <p className="my-0 py-0">{cvData.contact.title}</p>
                    </Container>
                </Container>
            )}

            <Container className="d-flex justify-content-center align-items-center">
                <hr className="w-75"/>
            </Container>

            {isMobile ? (
                // Mobile contact layout
                <Container>
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
            ) : (
                // Desktop contact layout
                <Container className="d-flex justify-content-center align-items-center">
                    <ul className="container m-auto p-auto">
                        {contactFields.map((field, index) => {
                            const [key, iconClass, hrefPrefix] = field;
                            const value = cvData.contact[key as keyof typeof cvData.contact];
                            return (
                                <li key={index} className="row my-2">
                                    <div className="col-2 d-flex justify-content-end align-items-center">
                                        <FontAwesomeIcon icon={iconClass}/>
                                    </div>
                                    <div className="col-10">
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
            )}
        </Container>
    );
};

// AboutMe component
const AboutMe: React.FC = () => {
    const {t} = useTranslation();
    const cvData = cv(t);
    const contactFields: [string, IconDefinition, string | null][] = [
        ["email", faEnvelope, "mailto:"], ["phone", faPhone, "tel:"],
        ["birthday", faCalendarAlt, null], ["location", faMapMarkerAlt, null],
    ];

    // Stage 1: Adjust container widths synchronously after the layout is known.
    // This runs on every render, ensuring the layout is always up-to-date.
    useLayoutEffect(() => {
        adjustFixedContainerWidth();
    });

    // Stage 2: Draw timeline lines after the component has been painted.
    useEffect(() => {
        const svgLg = document.querySelector("#timeline-line-lg") as SVGSVGElement | null;
        const svgSm = document.querySelector("#timeline-line-sm") as SVGSVGElement | null;

        const desktopHost = document.querySelector(".dynamic-content-container") as HTMLElement | null;
        const mobileHost = document.querySelector(".d-lg-none") as HTMLElement | null;

        // 尺寸观察，宿主变化时同步 SVG 尺寸并重画
        const roList: ResizeObserver[] = [];
        if (desktopHost && svgLg) {
            const ro = new ResizeObserver(() => {
                sizeOverlaySvg(svgLg, desktopHost);
                requestAnimationFrame(processAllTimelines); // 下一帧测量
            });
            ro.observe(desktopHost);
            roList.push(ro);
        }
        if (mobileHost && svgSm) {
            const ro = new ResizeObserver(() => {
                sizeOverlaySvg(svgSm, mobileHost);
                requestAnimationFrame(processAllTimelines);
            });
            ro.observe(mobileHost);
            roList.push(ro);
        }

        // 统一的重绘函数，带 0 尺寸保护
        function processAllTimelines() {
            if (svgLg) clearSvgLines(svgLg);
            if (svgSm) clearSvgLines(svgSm);

            // 保护：若 SVG 仍未有尺寸，直接跳过本轮
            const svgLgRect = svgLg ? getRect(svgLg) : null;
            const svgSmRect = svgSm ? getRect(svgSm) : null;

            // 大屏
            if (svgLg && svgLgRect) {
                processTimeline({
                    bookIcon: document.querySelector("#book-icon-lg") as (HTMLElement | SVGGraphicsElement | null),
                    internIcon: document.querySelector("#briefcase-icon-lg") as (HTMLElement | SVGGraphicsElement | null),
                    educationCircles: document.querySelectorAll(".education-circle-lg") as NodeListOf<HTMLElement | SVGGraphicsElement>,
                    internshipCircles: document.querySelectorAll(".internship-circle-lg") as NodeListOf<HTMLElement | SVGGraphicsElement>,
                    svg: svgLg,
                });
            }
            // 小屏
            if (svgSm && svgSmRect) {
                processTimeline({
                    bookIcon: document.querySelector("#book-icon-sm") as (HTMLElement | SVGGraphicsElement | null),
                    internIcon: document.querySelector("#briefcase-icon-sm") as (HTMLElement | SVGGraphicsElement | null),
                    educationCircles: document.querySelectorAll(".education-circle-sm") as NodeListOf<HTMLElement | SVGGraphicsElement>,
                    internshipCircles: document.querySelectorAll(".internship-circle-sm") as NodeListOf<HTMLElement | SVGGraphicsElement>,
                    svg: svgSm,
                });
            }
        }

        // 初始：先同步一次 SVG 像素尺寸，再到下一帧测量
        sizeOverlaySvg(svgLg, desktopHost || null);
        sizeOverlaySvg(svgSm, mobileHost || null);
        const raf = requestAnimationFrame(processAllTimelines);

        const handleResize = () => {
            adjustFixedContainerWidth();
            sizeOverlaySvg(svgLg, desktopHost || null);
            sizeOverlaySvg(svgSm, mobileHost || null);
            requestAnimationFrame(processAllTimelines);
        };
        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
            cancelAnimationFrame(raf);
            roList.forEach(ro => ro.disconnect());
        };
    }, [t, cvData]); // 语言/数据变化时重画

    // --- Render the AboutMe page content ---
    return (
        <MainLayout activePage={t("About Me")}>
            <PageHead
                title={t("About LIU Ziyi - AI Researcher at Institut Polytechnique de Paris")}
                description="Learn about LIU Ziyi. Expertise in Machine Learning, Computer Vision, Trustworthy AI, and more."
            />

            {/* Desktop View */}
            <div className="d-none d-lg-block mx-lg-5 mt-5 mb-1 px-5" style={{position: "relative"}}>
                {/* Left sidebar */}
                <ContactSection cvData={cvData} contactFields={contactFields}/>

                {/* Right Content - now with dynamic-content-container class */}
                <div className="dynamic-content-container" style={{position: "relative"}}>
                    {/* Timeline SVG for desktop */}
                    <svg id="timeline-line-lg"
                         style={{
                             position: "absolute", width: "100%", height: "100%",
                             top: 0, left: 0, zIndex: 1, pointerEvents: "none"
                         }}
                    />
                    <MainContent t={t} cvData={cvData} sizeSuffix="-lg"/>
                </div>
            </div>

            {/* Mobile View */}
            <div className="d-lg-none my-4 mx-3" style={{position: "relative"}}>
                <Row>
                    {/* Contact section for mobile */}
                    <ContactSection cvData={cvData} contactFields={contactFields} isMobile={true}/>

                    {/* Timeline SVG for mobile */}
                    <svg id="timeline-line-sm"
                         style={{
                             position: "absolute", width: "100%", height: "100%",
                             top: 0, left: 0, zIndex: 1, pointerEvents: "none"
                         }}
                    />

                    {/* Main content for mobile */}
                    <MainContent t={t} cvData={cvData} sizeSuffix="-sm"/>
                </Row>
            </div>
        </MainLayout>
    );
};

export default AboutMe;
