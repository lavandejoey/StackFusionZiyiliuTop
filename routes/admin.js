// routes/admin.js
const express = require("express");
const router = express.Router();
// const {v2rayLogParser} = require('../script/v2rayLogParser'); // Adjust path as per your project structure
const {parseMultipleV2RayLogs, getAllLogPaths} = require('../script/v2rayLogParser'); // Adjust path as per your project structure
const {User} = require("../models/authentication");
const {getCommonViewOptions} = require("./utils");

// Session auth check for all routes under /admin
// Not logged in -> Redirect to login page
// Logged in as non-admin -> Redirect to user page
// Logged in as admin -> Proceed to admin page
router.use(async (req, res, next) => {
    if (req.session && req.session.isLoggedIn) {
        // Fetch the user from the database to ensure all data is available
        const userInstance = new User(req.session.userId);
        await userInstance.fetchUser(); // Ensure user data is loaded

        // Check if the user is an admin
        const isAdmin = await userInstance.isAdmin();
        if (isAdmin) {
            next(); // Proceed to the /admin route
        } else {
            console.log("User role is " + userInstance.role);
            res.redirect('/console/' + userInstance.uuid); // Redirect to user page if not an admin
        }
    } else {
        req.session.redirectTo = req.originalUrl; // Store the requested URL for redirection after login
        res.redirect('/auth'); // Redirect to login page
    }
});

function mergeVisitorData(existing, newVisitor) {
    // Merge hourly counts
    for (const hour in newVisitor.requestHourlyCounts) {
        if (existing.requestHourlyCounts[hour]) {
            existing.requestHourlyCounts[hour] += newVisitor.requestHourlyCounts[hour];
        } else {
            existing.requestHourlyCounts[hour] = newVisitor.requestHourlyCounts[hour];
        }
    }

    // Merge daily counts
    for (const day in newVisitor.requestDailyCounts) {
        if (existing.requestDailyCounts[day]) {
            existing.requestDailyCounts[day] += newVisitor.requestDailyCounts[day];
        } else {
            existing.requestDailyCounts[day] = newVisitor.requestDailyCounts[day];
        }
    }

    // Merge domain counts
    for (const domain in newVisitor.domains) {
        if (existing.domains[domain]) {
            existing.domains[domain] += newVisitor.domains[domain];
        } else {
            existing.domains[domain] = newVisitor.domains[domain];
        }
    }
}

// Route to display parsed log data
router.get('/', async (req, res) => {
    try {
        // Fetch all users
        const userList = await User.getAllUsers();

        // 1) Gather DE logs
        const deLogDir = '/var/log/v2ray';
        const deVisitData = await parseMultipleV2RayLogs(getAllLogPaths(deLogDir), 'DE');

        // 2) Gather US logs
        const usLogDir = '/var/log/v2ray-us';
        const usVisitData = await parseMultipleV2RayLogs(getAllLogPaths(usLogDir), 'US');

        // 3) Combine all log lists, they are list of dict
        const allVisitData = [...deVisitData, ...usVisitData];

        // Pass each dataset separately and a combined version
        res.render("admin", {
            ...getCommonViewOptions(req, res, res.__("Admin")),
            userList,
            deVisitLogData: deVisitData,
            usVisitLogData: usVisitData,
            allVisitLogData: Object.values(allVisitData),
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Server error");
    }
});

module.exports = router;
