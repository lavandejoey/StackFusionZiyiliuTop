// About me routes

// Require express and create a router
const express = require('express');
const router = express.Router();

// GET contact page
router.get('/', function (req, res, next) {
    res.render('about_me', {
        lang: req.getLocale(),
        activePage: 'About Me',
        title: req.app.locals.title,
        domain: req.app.locals.domain,
        author: req.app.locals.author
    });
});

module.exports = router;