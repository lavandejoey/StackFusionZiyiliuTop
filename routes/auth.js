const express = require("express");
const router = express.Router();
const {User} = require("../models/authentication"); // Import User directly

router.get('/', (req, res) => {
    res.render('auth', {
        lang: req.getLocale(),
        activePage: 'Login',
        pageTitle: res.__('Login'),
        domain: req.app.locals.domain
    });
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const user = new User(null, email);
    await user.fetchUser();

    const authenticated = await user.authenticateUser(password);

    if (authenticated) {
        req.session.isLoggedIn = true;
        req.session.user = user;
        const redirectTo = req.session.redirectTo || '/monitor';
        delete req.session.redirectTo;
        res.redirect(redirectTo);
    } else {
        res.render('auth', {
            // csrfToken is available globally
            lang: req.getLocale(),
            activePage: 'Login',
            pageTitle: res.__('Login'),
            domain: req.app.locals.domain,
            error: res.__('Invalid email or password')
        });
    }
});

router.post('/signup', async (req, res) => {
    const { email, password, first_name, last_name } = req.body;
    const user = new User();
    await user.createUser(null, email, password, first_name, last_name);

    req.session.isLoggedIn = true;
    req.session.user = user;
    res.redirect(req.session.redirectTo);
});

router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/auth/login');
});

module.exports = router;
