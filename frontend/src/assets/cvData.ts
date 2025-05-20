// /StackFusionZiyiliuTop/frontend/src/assets/cvData.tsx
export const cvData = (t: (key: string) => string) => ({
    // Concatenate the about me parts into a single string.
    aboutMe1: [
        t("I'm currently pursuing the Master's degree in Data and AI at the IP Paris."),
        t("My background in Intelligence and Robotics, with a BEng from East China University of Science and Technology, includes research experience in SLAM using computer vision."),
        t("I am passionate about making AI more transparent and interpretable, which drives my interest in Explainable AI and Computer Vision."),
    ].join(" "),

    aboutMe2: [
        t("Proficient in Python, C++, Rust, SQL Query, MATLAB, I also have experience with TensorFlow and PyTorch or dealing full stack development works under Linux environment."),
        t("I am proficient in English, Mandarin and Cantonese, and currently learning French and Italian to expand my international profile."),
    ].join(" "),

    // Contact information for your CV.
    contact: {
        name: t("Ziyi Liu"),
        portraitSrc: "/images/6702323f5tc220c8b48779336a48bb54.jpg",
        portraitAlt: "Ziyi Liu Portrait",
        title: t("AI Engineer"),
        email: "ziyi.ipparis@outlook.com",
        phone: t("+33 7 49 97 62 42"),
        birthday: t("December 11, 2001"),
        location: t("Rte de Saclay, 91120 Palaiseau, France"),
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
        // Uncomment the following block if you wish to include the ENSTA Paris internship.
        // {
        //   institution: t("ENSTA Paris, U2IS Laboratory"),
        //   start: t("Apr 2025"),
        //   end: t("Aug 2025"),
        //   location: t("Paris, France"),
        //   titles: [t("Research Intern in XAI")],
        //   logoSrc: "/images/logos/ENSTA_logo.png",
        //   logoAlt: "ENSTA Paris Logo",
        //   logoTitle: "ENSTA Paris",
        // },
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
    ]
});
