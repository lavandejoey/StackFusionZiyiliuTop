// routes/auth.js
const express = require("express");
const router = express.Router();
const {User, UserRole} = require("../models/authentication");
const {check, validationResult} = require('express-validator');
const {getCommonViewOptions, regenerateSession, updateSession} = require("./utils");


// ----- GET Routes -----
// Handle GET requests for '/', '/login', and '/logout'
router.get(['/', '/login'], (req, res) => {
    // If logged in, redirect to user page
    if (req.session && req.session.isLoggedIn) {
        return res.redirect(`/console/${req.session.userId}`);
    }

    return res.render("auth", {
        ...getCommonViewOptions(req, res, res.__("Login"), "Login to access your account")
    });
});

router.get('/signup', (req, res) => {
    return res.render("auth", {
        ...getCommonViewOptions(req, res, res.__("Signup"), "Create a new account")
    });
});

// ----- POST /auth/login -----
// Validation rules for login (using plain strings for error messages)
const loginValidations = [
    check("email").notEmpty().withMessage("Email is required"),
    check("email").isEmail().withMessage("Invalid email address"),
    check("password").notEmpty().withMessage("Password is required"),
    check("password").isLength({min: 6}).withMessage("Password must be at least 6 characters long"),
];

router.post('/login', loginValidations, async (req, res) => {
    try {
        const {email, password} = req.body;
        const user = new User(null, email);
        await user.fetchUser();

        if (!user.uuid) {
            return res.render("auth", {
                ...getCommonViewOptions(req, res, res.__("Login"), "Login to access your account"),
                error: res.__("Invalid email or password"),
            });
        }

        if (user.isLocked()) {
            return res.render("auth", {
                ...getCommonViewOptions(req, res, res.__("Login"), "Login to access your account"),
                error: res.__("Account is inactive, please contact support"),
            });
        }

        const authenticated = await user.authenticateUser(password);
        if (authenticated) {
            // Regenerate session to prevent fixation
            const redirectTo = req.session.redirectTo || `/console/${user.uuid}`;
            delete req.session.redirectTo;
            await regenerateSession(req);
            updateSession(req, user);

            return res.redirect(redirectTo);
        } else {
            return res.render("auth", {
                ...getCommonViewOptions(req, res, res.__("Login"), "Login to access your account"),
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
                ...getCommonViewOptions(req, res, res.__("Signup"), "Create a new account"),
                error: errors.array()
            });
        }

        const {email, password, first_name, last_name} = req.body;
        const user = new User(null, email);
        await user.fetchUser();

        if (user.uuid) {
            return res.render("auth", {
                ...getCommonViewOptions(req, res, res.__("Signup"), "Create a new account"),
                error: res.__("User with this email already exists")
            });
        }

        const newUser = new User();
        await newUser.createUser(null, email, password, first_name, last_name);

        // Regenerate session to prevent fixation
        const redirectTo = req.session.redirectTo || `/console/${newUser.uuid}`;
        delete req.session.redirectTo;
        await regenerateSession(req);
        updateSession(req, newUser);

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
