// routes/about-me.js

// Require express and create a router
const express = require("express");
const router = express.Router();
const {cv} = require("../data/cv");
const {getCommonViewOptions} = require("./utils.route");

// GET contact page
router.get('/', function (req, res, next) {
    // About me parts

    res.render("about-me", {
        ...getCommonViewOptions(req, res,
            res.__("About LIU Ziyi - AI Researcher at Institut Polytechnique de Paris"),
            "Learn about LIU Ziyi. Expertise in Machine Learning, Computer Vision, Trustworthy AI, and more."
        ),
        activePage: "About Me",
        pageData: cv(res),
    });
});

module.exports = router;
