// routes/index.js
const express = require("express");
const router = express.Router();

/* GET home page. */
router.get('/', function (req, res, next) {
    res.render("index", {
        lang: req.getLocale(),
        activePage: "Home",
        pageTitle: res.__("Home"),
        domain: req.app.locals.domain,
    });
});
router.get(['/index', '/home'], (req, res, next) => {
    res.redirect('/');
});

// Other Sub-routes Redirection
router.get(['/login', '/logout'], (req, res) => {
    res.redirect('/auth');
});

module.exports = router;
