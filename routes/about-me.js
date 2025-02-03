// routes/about-me.js

// Require express and create a router
const express = require("express");
const router = express.Router();
const {cv} = require("../data/cv");

// GET contact page
router.get('/', function (req, res, next) {
    // About me parts

    res.render("about-me", {
        lang: req.getLocale(),
        activePage: "About Me",
        pageTitle: res.__("About Me"),
        domain: req.app.locals.domain,
        pageData: cv(res),
    });
});

module.exports = router;
