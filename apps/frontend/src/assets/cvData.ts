// /StackFusionZiyiliuTop/frontend/src/assets/cvData.tsx
export const cvData = (t: (key: string) => string) => ({
    topInfo: "",
    // topInfo: "📢 Seeking <b>Research Assistant (Apr/May 2026) in CV / 3D / Embodied AI</b>, and PhD opportunities for 2027.",
    // Concatenate the about me parts into a single string.
    aboutMes: [[
        t('Hi there👋 I am a Master’s student in Data & AI at <a href="https://www.ip-paris.fr/en" target="_blank" rel="noreferrer noopener">Institut Polytechnique de Paris</a>.'),
        t('My research interests include <b>computer vision, world models, and reliable AI</b>.'),
        t('I have research experience in video forgery detection, covariate-shift detection, multimodal uncertainty, and vision-based SLAM.'),
    ].join(" "), [
        t('I am now looking for a <b>full-time Research Assistant opportunity</b> where I can contribute through implementation, benchmarking, experimentation, and analysis.'),
        t('I am also open to collaborations. Please feel free to explore my <a href="https://scholar.google.com/citations?user=5iI_ZC4AAAAJ&hl=en" target="_blank" rel="noreferrer noopener">Google Scholar</a>, <a href="/docs/CVenRA2026April.pdf" target="_blank" rel="noreferrer noopener">CV</a>, and selected projects, or reach out via email.'),
    ].join(" ")],

    // Contact information for your CV.
    contact: {
        name: t("Ziyi LIU"),
        portraitSrc: "/images/6702323f5tc220c8b48779336a48bb54.jpg",
        portraitAlt: "Ziyi Liu Portrait",
        title: t("AI Engineer"),
        email: "Ziyi.IPParis@outlook.com",
        phone: t("+33 (0)7 49 97 62 42"),
        birthday: t("December 11, 2001"),
        location: t("Rte de Saclay, 91120 Palaiseau, France"),
        googleScholar: "https://scholar.google.com/citations?user=5iI_ZC4AAAAJ&hl=en",
        cvPdf: "/CVenRA2026April.pdf",
    },

    // Educational background array.
    educations: [
        {
            institution: `${t("Institut Polytechnique de Paris")} / ${t("Télécom Paris")} / ${t("ENSTA")} / ${t("École Polytechnique")}`,
            start: "2024",
            end: "2026",
            location: t("Paris, France"),
            titles: [t("Master of Computer Science, Data and AI, GPA: 16/20")],
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
                t("Bachelor of Engineering in Intelligence & Robotics, GPA: 3.0/4.0"),
                t("Minor in Computer Science (2021 - 2024)"),
            ],
            logoSrc: "/images/logos/ECUST_university_logo.png",
            logoAlt: "East China University of Science and Technology Logo",
            logoTitle: "East China University of Science and Technology",
        },
    ],

    // Internships array.
    internships: [
        {
            institution: t("Hi! PARIS Lab"),
            start: t("Jun 2025"),
            end: t("Nov 2025"),
            location: t("Paris, France"),
            titles: [t("Research Intern in Video Forgery Benchmark, supervised by Prof. Vicky Kalogeiton")],
            logoSrc: "/images/logos/HiParis_logo.png",
            logoAlt: "Hi! Paris Logo",
            logoTitle: "Hi! Paris",
        },
        {
            institution: t("ENSTA Paris U2IS"),
            start: t("Nov 2025"),
            end: t("Apr 2026"),
            location: t("Paris, France"),
            titles: [t("Research Assistant in Covariate Shift, supervised by Dr. Gianni Franchi")],
            logoSrc: "/images/logos/ENSTA_logo.png",
            logoAlt: "ENSTA Paris Logo",
            logoTitle: "ENSTA Paris U2IS",
        },
        {
            institution: t("ENSTA Paris U2IS"),
            start: t("Nov 2024"),
            end: t("Apr 2025"),
            location: t("Paris, France"),
            titles: [t("Multimodal Uncertainty Survey, supervised by Dr. Gianni Franchi")],
            logoSrc: "/images/logos/ENSTA_logo.png",
            logoAlt: "ENSTA Paris Logo",
            logoTitle: "ENSTA Paris U2IS",
        },
        {
            institution: t("ECUST Mobile Robot Lab"),
            start: t("Jun 2023"),
            end: t("Nov 2023"),
            location: t("Shanghai, China"),
            titles: [t("Research Assistant in vSLAM, supervised by Dr. Shuang Liu")],
            logoSrc: "/images/logos/ECUST_university_logo.png",
            logoAlt: "East China University of Science and Technology Logo",
            logoTitle: "ECUST Mobile Robot Lab",
        },
        {
            institution: t("Porsche Financial Leasing Ltd."),
            start: t("Jan 2024"),
            end: t("Jul 2024"),
            location: t("Shanghai, China"),
            titles: [t("PFS Residual Value Assistant Intern")],
            logoSrc: "/images/logos/porsche_logo.svg",
            logoAlt: "Porsche Financial Leasing Ltd. Logo",
            logoTitle: "Porsche Financial Leasing Ltd.",
        },
        {
            institution: t("Bank of Communication Financial Technology Co., Ltd."),
            start: t("Dec 2022"),
            end: t("Feb 2023"),
            location: t("Shanghai, China"),
            titles: [t("Back-end Developer Intern")],
            logoSrc: "/images/logos/boc_logo.svg",
            logoAlt: "Bank of Communication Financial Technology Co., Ltd. Logo",
            logoTitle: "Bank of Communication Financial Technology Co., Ltd.",
        },
        {
            institution: t("Institute of Software, Chinese Academy of Sciences"),
            start: t("Apr 2022"),
            end: t("Sept 2022"),
            location: t("Remote"),
            titles: [t("Development and Testing Intern")],
            logoSrc: "/images/logos/iscas_logo.png",
            logoAlt: "Institute of Software, Chinese Academy of Sciences Logo",
            logoTitle: "Institute of Software, Chinese Academy of Sciences",
        },
    ],
});
