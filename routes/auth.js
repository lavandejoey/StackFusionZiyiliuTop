const express = require("express");
const router = express.Router();
const { User, UserRole } = require("../models/authentication");
const { check, validationResult } = require('express-validator');

/**
 * Helper: Returns common view options for rendering the auth page.
 * @param {Object} req Express request
 * @param {Object} res Express response
 * @param {String} activePage The active page (e.g., "Login" or "Signup")
 * @returns {Object} Common view options
 */
function getCommonViewOptions(req, res, activePage) {
    return {
        lang: req.getLocale(),
        activePage: activePage,
        pageTitle: res.__(activePage),
        domain: req.app.locals.domain
    };
}

/**
 * Helper: Renders the auth page with provided additional options.
 * @param {Object} req Express request
 * @param {Object} res Express response
 * @param {Object} options Additional view options (e.g., error messages)
 */
function renderAuthPage(req, res, options = {}) {
    res.render("auth", { ...getCommonViewOptions(req, res, "Login"), ...options });
}

/**
 * Helper: Wraps session regeneration in a promise for async/await.
 * @param {Object} req Express request
 * @returns {Promise}
 */
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
router.get(['/', '/login', '/logout'], (req, res) => {
    renderAuthPage(req, res);
});

// ----- POST /auth/login -----
// Validation rules for login
const loginValidations = [
    check("email").isEmail().withMessage("Invalid email address"),
    check("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters long")
];

router.post('/login', loginValidations, async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = new User(null, email);
        await user.fetchUser();

        const authenticated = await user.authenticateUser(password);
        if (authenticated) {
            await regenerateSession(req);
            req.session.isLoggedIn = true;
            req.session.userId = user.uuid;
            const redirectTo = req.session.redirectTo || `/user/${user.uuid}`;
            delete req.session.redirectTo;
            return res.redirect(redirectTo);
        } else {
            return res.render("auth", {
                ...getCommonViewOptions(req, res, "Login"),
                error: res.__("Invalid email or password")
            });
        }
    } catch (err) {
        console.error("Error during login:", err);
        return res.status(500).send("Internal Server Error");
    }
});

// ----- POST /auth/signup -----
// Validation rules for signup
const signupValidations = [
    check("email").isEmail().withMessage("Invalid email address"),
    check("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters long"),
    check("first_name").notEmpty().withMessage("First name is required"),
    check("last_name").notEmpty().withMessage("Last name is required")
];

router.post('/signup', signupValidations, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).render("auth", {
                ...getCommonViewOptions(req, res, "Signup"),
                error: errors.array()
            });
        }

        const { email, password, first_name, last_name } = req.body;
        const user = new User(null, email);
        await user.fetchUser();

        if (user.uuid) {
            return res.render("auth", {
                ...getCommonViewOptions(req, res, "Signup"),
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
    // Store redirect target, then destroy session
    const redirectTo = req.session.redirectTo || "/";
    delete req.session.redirectTo;

    req.session.destroy((err) => {
        if (err) {
            console.error("Error destroying session:", err);
            return res.status(500).send("Internal Server Error");
        }
        res.clearCookie('connect.sid');
        return res.redirect(redirectTo);
    });
});

module.exports = router;
