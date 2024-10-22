const express = require("express");
const router = express.Router();
const {User} = require("../models/authentication"); // Import User directly
const {check, validationResult} = require('express-validator');

router.get('/', (req, res) => {
    res.render('auth', {
        lang: req.getLocale(),
        activePage: 'Login',
        pageTitle: res.__('Login'),
        domain: req.app.locals.domain
    });
});

router.post('/login', [
    check('email').isEmail().withMessage('Invalid email address'),
    check('password').isLength({min: 8}).withMessage('Password must be at least 8 characters long')
], async (req, res) => {
    const {email, password} = req.body;
    const user = new User(null, email);
    await user.fetchUser();

    const authenticated = await user.authenticateUser(password);

    if (authenticated) {
        req.session.regenerate((err) => {
            if (err) {
                console.error("Error regenerating session:", err);
                return res.status(500).send('Internal Server Error');
            }
            // Store user data in session
            req.session.isLoggedIn = true;
            req.session.userId = user.uuid;
            const redirectTo = req.session.redirectTo || '/monitor';
            delete req.session.redirectTo;
            res.redirect(redirectTo);
        });
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

router.post('/signup', [
    check('email').isEmail().withMessage('Invalid email address'),
    check('password').isLength({min: 8}).withMessage('Password must be at least 8 characters long'),
    check('first_name').notEmpty().withMessage('First name is required'),
    check('last_name').notEmpty().withMessage('Last name is required')
], async (req, res) => {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).render('auth', {
            lang: req.getLocale(),
            activePage: 'Signup',
            pageTitle: res.__('Signup'),
            domain: req.app.locals.domain,
            errors: errors.array()
        });
    }
    const {email, password, first_name, last_name} = req.body;

    // Check if user already exists
    const user = new User(null, email);
    await user.fetchUser();

    if (user.uuid) {
        // User already exists, display error
        return res.render('auth', {
            lang: req.getLocale(),
            activePage: 'Signup',
            pageTitle: res.__('Signup'),
            domain: req.app.locals.domain,
            error: res.__('User with this email already exists')
        });
    }

    // Create the new user
    const newUser = new User();
    await newUser.createUser(null, email, password, first_name, last_name);

    // Set session for new user
    req.session.isLoggedIn = true;
    req.session.userId = newUser.uuid;
    res.redirect(req.session.redirectTo || '/monitor');
});

router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error("Error destroying session:", err);
            return res.status(500).send('Internal Server Error');
        }
        res.clearCookie('connect.sid');  // Ensure the session cookie is cleared
        res.redirect('/auth');
    });
});

module.exports = router;
