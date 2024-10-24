const express = require("express");
const router = express.Router();
const {User, UserRole} = require("../models/authentication");

// Middleware to check if user is logged in
function isAuthenticated(req, res, next) {
    if (req.session.isLoggedIn) {
        return next();
    }
    res.redirect('/auth');
}

// Middleware to check if the user has permission to view the profile
function canViewProfile(req, res, next) {
    const {uuid} = req.params;
    const user = new User(req.session.userId);

    // Allow ADMIN and USER_MANAGER to access any profile
    if (user.isAdmin() || user.isUserManager()) {
        return next();
    }

    // Check if the logged-in user is trying to access their own profile
    if (user.uuid === uuid) {
        return next();
    }

    // If the user doesn't have permission, redirect them
    return res.status(403).render('error', {
        message: res.__('Access Denied'),
        error: {status: 403}
    });
}

// GET /user/:uuid - Protected Route
router.get('/:uuid', isAuthenticated, canViewProfile, async (req, res) => {
    const {uuid} = req.params;

    // Fetch the user by UUID
    const user = new User(uuid);
    await user.fetchUser();  // Assume this method fetches the user details

    // Check if the user exists
    if (!user.uuid) {
        return res.status(404).render('error', {
            message: res.__('User not found'),
            error: {status: 404}
        });
    }

    // Render user-specific page with fetched data
    res.render('user-profile', {
        lang: req.getLocale(),
        pageTitle: `${user.first_name} ${user.last_name}`,
        domain: req.app.locals.domain,
        user: {
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name
        }
    });
});

module.exports = router;