// routes/monitor.js
const express = require('express');
const path = require('path');
const router = express.Router();
const { v2rayLogParser } = require('../script/v2rayLogParser'); // Adjust path as per your project structure

// Route to display parsed log data
router.get('/', async (req, res) => {
    try {
        const logPath = '/var/log/v2ray/access.log'; // Path to your log file
        const visitors = await v2rayLogParser(logPath); // Parse the logs

        // Send data to Pug template
        res.render('monitor', { visitors });
    } catch (error) {
        console.error('Error parsing logs:', error);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;
