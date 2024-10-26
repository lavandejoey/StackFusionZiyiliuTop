const express = require("express");
const router = express.Router();
const {User, UserRole} = require("../models/authentication"); // Import User directly
const {check, validationResult} = require('express-validator');

// GET /auth
router.get('/', (req, res) => {
    res.render("auth", {
        lang: req.getLocale(),
        activePage: "Login",
        pageTitle: res.__("Login"),
        domain: req.app.locals.domain
    });
});

// POST /auth/login
router.post('/login', [
    check("email").isEmail().withMessage("Invalid email address"),
    check("password").isLength({min: 8}).withMessage("Password must be at least 8 characters long")
], async (req, res) => {
    const {email, password} = req.body;
    const user = new User(null, email);
    await user.fetchUser();

    const authenticated = await user.authenticateUser(password);

    if (authenticated) {
        req.session.regenerate((err) => {
            if (err) {
                console.error("Error regenerating session:", err);
                return res.status(500).send("Internal Server Error");
            }
            req.session.isLoggedIn = true;
            req.session.userId = user.uuid;
            const redirectTo = req.session.redirectTo || "/user/" + user.uuid;
            delete req.session.redirectTo;
            res.redirect(redirectTo);
        });
    } else {
        res.render("auth", {
            lang: req.getLocale(),
            activePage: "Login",
            pageTitle: res.__("Login"),
            domain: req.app.locals.domain,
            error: res.__("Invalid email or password")
        });
    }
});

// POST /auth/signup
router.post('/signup', [
    check("email").isEmail().withMessage("Invalid email address"),
    check("password").isLength({min: 8}).withMessage("Password must be at least 8 characters long"),
    check("first_name").notEmpty().withMessage("First name is required"),
    check("last_name").notEmpty().withMessage("Last name is required")
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).render("auth", {
            lang: req.getLocale(),
            activePage: "Signup",
            pageTitle: res.__("Signup"),
            domain: req.app.locals.domain,
            errors: errors.array()
        });
    }

    const {email, password, first_name, last_name} = req.body;
    const user = new User(null, email);
    await user.fetchUser();

    if (user.uuid) {
        return res.render("auth", {
            lang: req.getLocale(),
            activePage: "Signup",
            pageTitle: res.__("Signup"),
            domain: req.app.locals.domain,
            error: res.__("User with this email already exists")
        });
    }

    const newUser = new User();
    await newUser.createUser(null, email, password, first_name, last_name);

    req.session.isLoggedIn = true;
    req.session.userId = newUser.uuid;
    const redirectTo = req.session.redirectTo || "/user/" + newUser.uuid;
    delete req.session.redirectTo;
    res.redirect(redirectTo);
});

// GET /auth/logout
router.get('/logout', (req, res) => {
    // Store the redirectTo value before destroying the session
    const redirectTo = req.session.redirectTo || "/";
    delete req.session.redirectTo;

    req.session.destroy((err) => {
        if (err) {
            console.error("Error destroying session:", err);
            return res.status(500).send("Internal Server Error");
        }
        res.clearCookie('connect.sid');
        res.redirect(redirectTo);
    });
});


module.exports = router;
