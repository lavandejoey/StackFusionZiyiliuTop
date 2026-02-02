// /StackFusionZiyiliuTop/frontend/src/assets/cvData.tsx
export const cvData = (t: (key: string) => string) => ({
    topInfo: "📢 Seeking <b>Research Assistant (Apr/May 2026) in CV / 3D / Embodied AI</b>, and PhD opportunities for 2027.",
    // Concatenate the about me parts into a single string.
    aboutMes: [[
        t('Hi there👋 I am a Master’s student in Data & AI at <a href="https://www.ip-paris.fr/en" target="_blank" rel="noreferrer noopener">Institut Polytechnique de Paris</a>.'),
        t('Advised by Prof. <a href="https://giannifranchi.github.io/" target="_blank" rel="noreferrer noopener">Gianni Franchi</a> from <a href="http://u2is.ensta-paris.fr/" target="_blank" rel="noreferrer noopener">ENSTA Paris, U2IS</a>, I was also Intern in <a href="https://hi-paris.fr/" target="_blank" rel="noreferrer noopener">Hi! Paris</a> during Summer 2025.'),
        t('I am broadly interested in <b>Embodied AI and Trustworthy AI</b>, especially 2D and 3D vision representation and world models for long-horizon reasoning.'),
    ].join(" "), [
        t('I am now looking for a <b>full-time Research Assistant opportunity</b> where I can contribute immediately through implementation, benchmarking, experimentation, and analysis.'),
    ].join(" "), [
        t('I\'m also open to collaborations, if you\'re interested in, please feel free to explore my <a href="https://scholar.google.com/citations?user=5iI_ZC4AAAAJ&hl=en" target="_blank" rel="noreferrer noopener">Google Scholar</a> or <a href="/docs/CVenRA2026April.pdf" target="_blank" rel="noreferrer noopener">CV</a>, and reach out via email!'),
    ].join(" ")],

    // Contact information for your CV.
    contact: {
        name: t("Ziyi LIU"),
        portraitSrc: "/images/6702323f5tc220c8b48779336a48bb54.jpg",
        portraitAlt: "Ziyi Liu Portrait",
        title: t("AI Engineer"),
        email: "ziyi.ipparis@outlook.com",
        phone: t("+33 7 49 97 62 42"),
        birthday: t("December 11, 2001"),
        location: t("Rte de Saclay, 91120 Palaiseau, France"),
        googleScholar: "https://scholar.google.com/citations?user=5iI_ZC4AAAAJ&hl=en",
        cvPdf: "/CVenRA2026April.pdf",
    },

    // Educational background array.
    educations: [
        {
            institution: `${t("Institut Polytechnique de Paris")} / ${t("Télécom Paris")}`,
            start: "2024",
            end: "2026",
            location: t("Paris, France"),
            titles: [t("Master of Computer Science, Data and Artificial Intelligence")],
            logoSrc: "/images/logos/Institut_polytechnique_de_Paris_logo.svg",
            logoAlt: "Institut Polytechnique de Paris Logo",
            logoTitle: "Institut Polytechnique de Paris",
        },
        {
            institution: t("East China University of Science and Technology"),
            start: "2020",
            end: "2024",
            location: t("Shanghai, China"),
            titles: [
                t("Bachelor of Engineering, Intelligence and Robotics"),
                t("Mini-major Diploma, Computer Science (2021 - 2024)"),
            ],
            logoSrc: "/images/logos/ECUST_university_logo.png",
            logoAlt: "East China University of Science and Technology Logo",
            logoTitle: "East China University of Science and Technology",
        },
    ],

    // Internships array.
    internships: [
        {
            institution: t("Hi! Paris - Télécom Paris TLIC"),
            start: t("Jun 2025"),
            end: t("Aug 2025"),
            location: t("Paris, France"),
            titles: [t("Research Intern in Computer Vision")],
            logoSrc: "/images/logos/HiParis_logo.png",
            logoAlt: "HiParis Logo",
            logoTitle: "Hi! Paris",
        },
        {
            institution: t("Porsche Financial Leasing Ltd."),
            start: t("Jan 2024"),
            end: t("Jul 2024"),
            location: t("Shanghai, China"),
            titles: [t("PFS Residual Value Assistant")],
            logoSrc: "/images/logos/porsche_logo.svg",
            logoAlt: "Porsche Financial Leasing Ltd. Logo",
            logoTitle: "Porsche Financial Leasing Ltd.",
        },
        {
            institution: t("Bank of Communication Financial Technology Co, Ltd."),
            start: t("Dec 2022"),
            end: t("Feb 2023"),
            location: t("Shanghai, China"),
            titles: [t("Full-stack Developer")],
            logoSrc: "/images/logos/boc_logo.svg",
            logoAlt: "Bank of Communication Financial Technology Co, Ltd. Logo",
            logoTitle: "Bank of Communication Financial Technology Co, Ltd.",
        },
        {
            institution: t("Institute of Software, Chinese Academy of Sciences (ISCAS)"),
            start: t("Apr 2022"),
            end: t("Sept 2022"),
            location: `${t("Shanghai, China")} ${t("(Remote)")}`,
            titles: [t("Development and Testing")],
            logoSrc: "/images/logos/iscas_logo.png",
            logoAlt: "Institute of Software, Chinese Academy of Sciences (ISCAS) Logo",
            logoTitle: "Institute of Software, Chinese Academy of Sciences (ISCAS)",
        },
    ],
});
