const express = require('express');
const router = express.Router();

/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('index', {
        activePage: 'Home',
        title: req.app.locals.title,
        domain: req.app.locals.domain,
        author: req.app.locals.author
    });
});

module.exports = router;
