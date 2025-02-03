// data/cv.js

module.exports.cv = function (res) {
    const aboutMeParts1 = [
        res.__("I'm currently pursuing the Master's degree in Data and AI at the IP Paris."),
        res.__("My background in Intelligence and Robotics, with a BEng from East China University of Science and Technology, includes research experience in SLAM using computer vision."),
        res.__("I am passionate about making AI more transparent and interpretable, which drives my interest in Explainable AI and Computer Vision."),
    ];
    const aboutMeParts2 = [
        res.__("Proficient in Python, C++, Rust, SQL Query, MATLAB, I also have experience with TensorFlow and PyTorch or dealing full stack development works under Linux environment."),
        res.__("I am proficient in English, Mandarin and Cantonese, and currently learning French and Italian to expand my international profile.")
    ];

    const contact = {
        name: res.__("Ziyi Liu"),
        portraitSrc: "/images/6702323f5tc220c8b48779336a48bb54.jpg",
        portraitAlt: "Ziyi Liu Portrait",
        title: res.__("AI Engineer"),
        email: "ziyi.ipparis@outlook.com",
        phone: res.__("+33 7 49 97 62 42"),
        birthday: res.__("December 11, 2001"),
        location: res.__("Rte de Saclay, 91120 Palaiseau, France"),
    };

    const educations = [
        {
            institution: res.__("Institut Polytechnique de Paris") + " / " + res.__("Télécom Paris"),
            start: "2024",
            end: "2026",
            location: res.__("Paris, France"),
            titles: [
                res.__("Master of Computer Science, Data and Artificial Intelligence"),
            ],
            logoSrc: "/images/logos/Institut_polytechnique_de_Paris_logo.svg",
            logoAlt: "Institut Polytechnique de Paris Logo",
            logoTitle: "Institut Polytechnique de Paris"
        },
        {
            institution: res.__("East China University of Science and Technology"),
            start: "2020",
            end: "2024",
            location: res.__("Shanghai, China"),
            titles: [
                res.__("Bachelor of Engineering, Intelligence and Robotics"),
                res.__("Mini-major Diploma, Computer Science (2021 - 2024)")
            ],
            logoSrc: "/images/logos/ECUST_university_logo.png",
            logoAlt: "East China University of Science and Technology Logo",
            logoTitle: "East China University of Science and Technology"
        },
    ];

    const internships = [
        {
            institution: res.__("ENSTA Paris, U2IS Laboratory"),
            start: res.__("Apr 2025"),
            end: res.__("Aug 2025"),
            location: res.__("Paris, France"),
            titles: [res.__("Research Intern in XAI")],
            logoSrc: "/images/logos/ENSTA_logo.png",
            logoAlt: "ENSTA Paris Logo",
            logoTitle: "ENSTA Paris"
        },
        {
            institution: res.__("Porsche Financial Leasing Ltd."),
            start: res.__("Jan 2024"),
            end: res.__("Jul 2024"),
            location: res.__("Shanghai, China"),
            titles: [res.__("PFS Residual Value Assistant")],
            logoSrc: "/images/logos/porsche_logo.svg",
            logoAlt: "Porsche Financial Leasing Ltd. Logo",
            logoTitle: "Porsche Financial Leasing Ltd."
        },
        {
            institution: res.__("Bank of Communication Financial Technology Co, Ltd."),
            start: res.__("Dec 2022"),
            end: res.__("Feb 2023"),
            location: res.__("Shanghai, China"),
            titles: [res.__("Full-stack Developer")],
            logoSrc: "/images/logos/boc_logo.svg",
            logoAlt: "Bank of Communication Financial Technology Co, Ltd. Logo",
            logoTitle: "Bank of Communication Financial Technology Co, Ltd."
        },
        {
            institution: res.__("Institute of Software, Chinese Academy of Sciences (ISCAS)"),
            start: res.__("Apr 2022"),
            end: res.__("Sept 2022"),
            location: res.__("Shanghai, China") + " " + res.__("(Remote)"),
            titles: [res.__("Development and Testing")],
            logoSrc: "/images/logos/iscas_logo.png",
            logoAlt: "Institute of Software, Chinese Academy of Sciences (ISCAS) Logo",
            logoTitle: "Institute of Software, Chinese Academy of Sciences (ISCAS)"
        }
    ];

    return {
        aboutMe1: aboutMeParts1.join(" "),
        aboutMe2: aboutMeParts2.join(" "),
        contact,
        educations,
        internships,
    };
}