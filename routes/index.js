// routes/index.js
const express = require("express");
const {getCommonViewOptions} = require("./utils");
const router = express.Router();

/* GET home page. */
router.get('/', function (req, res, next) {
    res.render("index", {
        ...getCommonViewOptions(req, res, res.__("Home")),
        activePage: "Home",
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
