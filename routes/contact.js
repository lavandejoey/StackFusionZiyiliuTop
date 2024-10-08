// Contact routes

// Require express and create a router
const express = require('express');
const router = express.Router();

// GET contact page
router.get('/', function (req, res, next) {
    res.render('contact', {
        lang: req.getLocale(),
        activePage: 'Contact',
        pageTitle: res.__('Contact Me'),
        domain: req.app.locals.domain,
    });
});

module.exports = router;