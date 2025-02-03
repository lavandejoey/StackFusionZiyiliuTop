// routes/auth.js
const express = require("express");
const router = express.Router();
const {User, UserRole} = require("../models/authentication");
const {check, validationResult} = require('express-validator');

function getCommonViewOptions(req, res, activePage) {
    return {
        lang: req.getLocale(),
        activePage: activePage,
        pageTitle: activePage,
        domain: req.app.locals.domain
    };
}

function renderAuthPage(req, res, options = {}) {
    // Using res.__ to localize the "Login" page title
    res.render("auth", {...getCommonViewOptions(req, res, res.__("Login")), ...options});
}

function regenerateSession(req) {
    return new Promise((resolve, reject) => {
        req.session.regenerate((err) => {
            if (err) return reject(err);
            resolve();
        });
    });
}

// ----- GET Routes -----
// Handle GET requests for '/', '/login', and '/logout'
router.get(['/', '/login'], (req, res) => {
    renderAuthPage(req, res);
});

// ----- POST /auth/login -----
// Validation rules for login (using plain strings for error messages)
const loginValidations = [
    check("email").isEmail().withMessage("Invalid email address"),
    check("password").isLength({min: 6}).withMessage("Password must be at least 6 characters long")
];

router.post('/login', loginValidations, async (req, res) => {
    try {
        const {email, password} = req.body;
        const user = new User(null, email);
        await user.fetchUser();

        const authenticated = await user.authenticateUser(password);
        if (authenticated) {
            await regenerateSession(req);
            req.session.isLoggedIn = true;
            req.session.userId = user.uuid;
            req.session.email = user.email;
            req.session.username = user.first_name;
            req.session.isAdmin = await user.isAdmin();
            req.session.isUserManager = await user.isUserManager();
            const redirectTo = req.session.redirectTo || `/user/${user.uuid}`;
            delete req.session.redirectTo;
            return res.redirect(redirectTo);
        } else {
            return res.render("auth", {
                ...getCommonViewOptions(req, res, res.__("Login")),
                error: res.__("Invalid email or password")
            });
        }
    } catch (err) {
        console.error("Error during login:", err);
        return res.status(500).send("Internal Server Error");
    }
});

// ----- POST /auth/signup -----
// Validation rules for signup (using plain strings for error messages)
const signupValidations = [
    check("email").isEmail().withMessage("Invalid email address"),
    check("password").isLength({min: 6}).withMessage("Password must be at least 6 characters long"),
    check("first_name").notEmpty().withMessage("First name is required"),
    check("last_name").notEmpty().withMessage("Last name is required")
];

router.post('/signup', signupValidations, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).render("auth", {
                ...getCommonViewOptions(req, res, res.__("Signup")),
                error: errors.array()
            });
        }

        const {email, password, first_name, last_name} = req.body;
        const user = new User(null, email);
        await user.fetchUser();

        if (user.uuid) {
            return res.render("auth", {
                ...getCommonViewOptions(req, res, res.__("Signup")),
                error: res.__("User with this email already exists")
            });
        }

        const newUser = new User();
        await newUser.createUser(null, email, password, first_name, last_name);

        req.session.isLoggedIn = true;
        req.session.userId = newUser.uuid;
        const redirectTo = req.session.redirectTo || `/user/${newUser.uuid}`;
        delete req.session.redirectTo;
        return res.redirect(redirectTo);
    } catch (err) {
        console.error("Error during signup:", err);
        return res.status(500).send("Internal Server Error");
    }
});

// ----- GET /auth/logout -----
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error("Error destroying session:", err);
            return res.status(500).send("Internal Server Error");
        }
        res.clearCookie('connect.sid');
        return res.redirect('/');
    });
});

// ----- POST /auth/logout -----
router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error("Error destroying session:", err);
            return res.status(500).send("Internal Server Error");
        }
        res.clearCookie('connect.sid');
        return res.send("Logged out successfully");
    });
});


module.exports = router;
