// routes/console.js
const express = require("express");
const router = express.Router();
const {User, UserRole} = require("../models/authentication");
const {getCommonViewOptions} = require("./utils");

// Middleware to check if user is logged in
function isAuthenticated(req, res, next) {
    if (req.session && req.session.isLoggedIn) {
        return next();
    }
    req.session.redirectTo = req.originalUrl;  // Save URL for redirect after login
    return res.redirect('/auth/login');
}

// Middleware to check if user has permission
async function canViewProfile(req, res, next) {
    const {uuid} = req.params;
    const user = new User(req.session.userId);
    await user.fetchUser();

    if (await user.isAdmin() || await user.isUserManager() || user.uuid === uuid) {
        return next();
    }
    return res.status(403).render('error', {
        message: res.__('Access Denied'), error: {status: 403},
    });
}

// GET /console/:uuid - Protected Route
router.get('/:uuid', isAuthenticated, canViewProfile, async (req, res) => {
    const {uuid} = req.params;

    // Fetch the user by UUID
    const user = new User(uuid);
    await user.fetchUser();  // Assume this method fetches the user details

    // Check if the user exists
    if (!user.uuid) {
        return res.status(404).render('error', {
            message: res.__('User not found'), error: {status: 404}
        });
    }

    // Render user-specific page with fetched data
    res.render('console', {
        ...getCommonViewOptions(req, res, `${user.first_name} ${user.last_name}`),
    });
});

module.exports = router;