// routes/monitor.js
const express = require('express');
const path = require('path');
const router = express.Router();
const {v2rayLogParser} = require('../script/v2rayLogParser'); // Adjust path as per your project structure
const {User, UserRole} = require("../models/authentication");

// Session auth check for all routes under /monitor
// Not logged in -> Redirect to login page
// Logged in as non-admin -> Redirect to user page TODO
// Logged in as admin -> Proceed to monitor page
router.use(async (req, res, next) => {
    if (req.session && req.session.isLoggedIn) {
        const user = req.session.user;

        // Fetch the user from the database to ensure all data is available
        const userInstance = new User(user.uuid);
        await userInstance.fetchUser(); // Ensure user data is loaded

        // Check if the user is an admin
        const isAdmin = await userInstance.isAdmin();
        if (isAdmin) {
            next(); // Proceed to the /monitor route
        } else {
            console.log("User role is " + userInstance.role);
            res.redirect('/user/' + userInstance.uuid); // Redirect to user page if not an admin
        }
    } else {
        req.session.redirectTo = req.originalUrl; // Store the requested URL for redirection after login
        res.redirect('/auth'); // Redirect to login page
    }
});

// Route to display parsed log data
router.get('/', async (req, res) => {
    try {
        const logPath = '/var/log/v2ray/access.log'; // Path to your log file
        const visitors = await v2rayLogParser(logPath); // Parse the logs

        // Send data to Pug template
        res.render('monitor', {visitors});
    } catch (error) {
        console.error('Error parsing logs:', error);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;
