// /StackFusionZiyiliuTop/frontend/src/pages/Home.tsx
import React from "react";
import PageHead from "@/components/PageHead.tsx";
import MainLayout from "@/components/MainLayout.tsx";
import {useTypewriter, Cursor} from "react-simple-typewriter";
import {useTranslation} from "react-i18next";

const Home: React.FC = () => {
    // parse language code with i18n
    const {t, i18n} = useTranslation();
    const language = i18n.language;
    const [text] = useTypewriter({
        words:
            language === "fr"
                ? [
                    "Je suis <b>ZiYi</b> <b>Liu</b>",
                    "Je suis <b>Zeniths</b> in <b>Yielding</b> l'Intelligence pour Libérer les Idées Uniques"
                ]
                : [
                    "I am <b>ZiYi Liu</b>",
                    "I am <b>Zeniths</b> in <b>Yielding</b> Intelligence to Leverage Youthful Ideas"
                ],
        loop: true,
        delaySpeed: 1500,
    });

    return (
        <MainLayout activePage={"Home"}>
            <PageHead
                title={t("LIU Ziyi Personal Website") + " - " + t("Artificial Intelligence (AI) and Data Science") + " | " + t("Institut Polytechnique de Paris")}
                description="Official website of LIU Ziyi, AI Researcher and Data Scientist at Institut Polytechnique de Paris. Explore projects in Machine Learning, Computer Vision, Trustworthy AI, and more."
            />
            {/* Hidden H1 for SEO purposes */}
            <h1 className="d-none">
                {t("LIU Ziyi")} - {t("AI & Data Science at Institut Polytechnique de Paris")}
            </h1>
            <div
                className="container-fluid flex-grow-1 d-flex justify-content-center align-items-center"
                style={{height: "100%"}}
            >
                <div className="text-center" id="typewriter-container">
                    <p id="typewriter-text-wrapper">
                        {/* Render typewritten text as HTML */}
                        <span className={"user-select-none"}
                              id="typewriter-text"
                              dangerouslySetInnerHTML={{__html: text}}
                        />
                        <Cursor cursorStyle="|"/>
                    </p>
                </div>
            </div>
        </MainLayout>
    );
};

export default Home;
