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
router.use(['/index', '/home'], (req, res, next) => {
    res.redirect('/');
});

module.exports = router;
