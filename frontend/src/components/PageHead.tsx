import React from "react";
import {Helmet} from "react-helmet-async";

interface PageHeadProps {
    title: string;
    description?: string;
    keywords?: string;
    image?: string;
}

const PageHead: React.FC<PageHeadProps> = ({
                                               title, description,
                                               keywords = "LIU Ziyi, Ziyi Liu, AI Researcher, Data Scientist, Institut Polytechnique de Paris, IP Paris, ECUST, East China University of Science and Technology, Computer Vision, Machine Learning, Deep Learning, Data, AI, Portfolio, Research, Publications, V2Ray, Full Stack Developer, Web, Trustworthy AI, XAI",
                                               image = "/images/logo-pic-bg.png",
                                           }) => {
    return (
        <Helmet>
            {/* Set the page title */}
            <title>{title}</title>
            {/* Meta charset */}
            <meta charSet="utf-8"/>
            {/* Author link */}
            <link rel="author" href="/about-me"/>

            {/* Alternate language links for SEO */}
            <link rel="alternate" hrefLang="en" href="/frontend/public?lang=en"/>
            <link rel="alternate" hrefLang="fr" href="/frontend/public?lang=fr"/>
            <link rel="alternate" hrefLang="zh-CN" href="/frontend/public?lang=zh-CN"/>
            <link rel="alternate" hrefLang="zh-HK" href="/frontend/public?lang=zh-HK"/>

            {/* Favicon */}
            <link rel="icon" href="/images/favicon.ico" type="image/x-icon"/>

            {/* Responsive viewport meta tag */}
            <meta name="viewport" content="width=device-width, initial-scale=1.0"/>

            {/* Description meta tag */}
            {description && <meta name="description" content={description}/>}

            {/* Keywords meta tag */}
            {keywords && <meta name="keywords" content={keywords}/>}

            {/* Open Graph meta tags for social sharing */}
            <meta property="og:title" content={title}/>
            <meta property="og:description" content={description || ""}/>
            <meta property="og:image" content={image}/>

            {/* Twitter Card meta tags */}
            <meta name="twitter:card" content="summary_large_image"/>
            <meta name="twitter:title" content={title}/>
            <meta name="twitter:description" content={description || ""}/>
            <meta name="twitter:image" content={image}/>

            {/* Preconnect links for faster font loading */}
            <link rel="preconnect" href="https://fonts.googleapis.com"/>
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin=""/>

            {/* Load the Google Font stylesheet */}
            <link
                rel="stylesheet"
                href="https://fonts.googleapis.com/css2?family=Shantell+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700&display=swap"
            />
        </Helmet>
    );
}

export default PageHead;
