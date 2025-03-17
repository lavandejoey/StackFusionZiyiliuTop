// routes/index.js
const express = require("express");
const {getCommonViewOptions} = require("./utils.route");
const router = express.Router();

/* GET home page. */
router.get('/', function (req, res, next) {
    res.render("index", {
        ...getCommonViewOptions(
            req, res,
            res.__("LIU Ziyi Personal Website") + " - " + res.__("Artificial Intelligence (AI) and Data Science") + " | " + res.__("Institut Polytechnique de Paris"),
            "Official website of LIU Ziyi, AI Researcher and Data Scientist at Institut Polytechnique de Paris. Explore projects in Machine Learning, Computer Vision, Trustworthy AI, and more."
        ),
        activePage:
            "Home",
    })
    ;
});
router.get(['/index', '/home'], (req, res, next) => {
    res.redirect('/');
});

// Other Sub-routes Redirection
router.get(['/login', '/logout'], (req, res) => {
    res.redirect('/auth');
});

module.exports = router;
