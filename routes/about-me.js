// About me routes

// Require express and create a router
const express = require("express");
const router = express.Router();

// GET contact page
router.get('/', function (req, res, next) {
    // About me parts
    const aboutMeParts1 = [
        res.__("I'm currently pursuing the Master's degree in Data and AI at the IP Paris."),
        res.__("My background in Intelligence and Robotics, with a BEng from East China University of Science and Technology, includes research experience in SLAM using computer vision."),
        res.__("I am passionate about making AI more transparent and interpretable, which drives my interest in Explainable AI and Computer Vision."),
    ];
    const aboutMeParts2 = [
        res.__("Proficient in Python, C++, Rust, SQL Query, MATLAB, I also have experience with TensorFlow and PyTorch or dealing full stack development works under Linux environment."),
        res.__("I am proficient in English, Mandarin and Cantonese, and currently learning French and Italian to expand my international profile.")
    ];
    const pageDataJSON = {
        aboutMe1: aboutMeParts1.join(" "),
        aboutMe2: aboutMeParts2.join(" "),
    };

    res.render("about-me", {
        lang: req.getLocale(),
        activePage: "About Me",
        pageTitle: res.__("About Me"),
        domain: req.app.locals.domain,
        pageData: pageDataJSON,
    });
});

module.exports = router;
