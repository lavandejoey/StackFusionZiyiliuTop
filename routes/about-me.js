// About me routes

// Require express and create a router
const express = require("express");
const router = express.Router();

// GET contact page
router.get('/', function (req, res, next) {
    res.render("about-me", {
        lang: req.getLocale(),
        activePage: "About Me",
        pageTitle: res.__("About Me"),
        domain: req.app.locals.domain,
    });
});

module.exports = router;