// /routes/admin.js
const express = require("express");
const router = express.Router();
const {parseV2RayLogFile, getAllLogPaths} = require('../script/v2rayLogParser');
const {User} = require("../models/authentication");
const {getCommonViewOptions} = require("./utils");

// Session auth check for all routes under /admin
router.use(async (req, res, next) => {
    if (req.session && req.session.isLoggedIn) {
        const userInstance = new User(req.session.userId);
        await userInstance.fetchUser();
        const isAdmin = await userInstance.isAdmin();
        if (isAdmin) {
            next();
        } else {
            console.log("User role is " + userInstance.role);
            res.redirect('/console/' + userInstance.uuid);
        }
    } else {
        req.session.redirectTo = req.originalUrl;
        res.redirect('/auth');
    }
});

// GET admin page – render with empty log arrays (the logs will be loaded progressively)
router.get('/', async (req, res) => {
    try {
        const userList = await User.getAllUsers();
        res.render("admin", {
            ...getCommonViewOptions(req, res, res.__("Admin")),
            userList,
            deVisitLogData: [],
            usVisitLogData: [],
            allVisitLogData: []
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Server error");
    }
});

// SSE endpoint for streaming log data progressively.
router.get('/logs-stream', async (req, res) => {
    res.set({
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
    });
    res.flushHeaders();

    const deLogDir = '/var/log/v2ray';
    const usLogDir = '/var/log/v2ray-us';
    const deFiles = getAllLogPaths(deLogDir);
    const usFiles = getAllLogPaths(usLogDir);

    const tasks = [];
    deFiles.forEach(filePath => {
        tasks.push({server: 'DE', file: filePath});
    });
    usFiles.forEach(filePath => {
        tasks.push({server: 'US', file: filePath});
    });

    let completed = 0;
    tasks.forEach(task => {
        parseV2RayLogFile(task.file, task.server)
            .then(logs => {
                completed++;
                const eventData = {
                    file: task.file,
                    server: task.server,
                    logs: logs,
                    completed: completed,
                    total: tasks.length
                };
                res.write(`data: ${JSON.stringify(eventData)}\n\n`);
                if (completed === tasks.length) {
                    res.write(`event: end\ndata: done\n\n`);
                    res.end();
                }
            })
            .catch(error => {
                completed++;
                const eventData = {
                    file: task.file,
                    server: task.server,
                    error: error.toString(),
                    completed: completed,
                    total: tasks.length
                };
                res.write(`data: ${JSON.stringify(eventData)}\n\n`);
                if (completed === tasks.length) {
                    res.write(`event: end\ndata: done\n\n`);
                    res.end();
                }
            });
    });
});

module.exports = router;
