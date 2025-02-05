const fs = require("fs");
const path = require("path");
const readline = require("readline");
const geoip = require('geoip-lite');
const zlib = require("zlib");

async function parseMultipleV2RayLogs(filePaths, serverName) {
    const visitors = new Map();

    for (const filePath of filePaths) {
        // Skip if file doesn't exist or is not readable
        if (!fs.existsSync(filePath)) continue;

        const isGzipped = filePath.endsWith(".gz");
        const fileStream = isGzipped
            ? fs.createReadStream(filePath).pipe(zlib.createGunzip())  // Decompress if gzipped
            : fs.createReadStream(filePath);

        const rl = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity
        });

        for await (const line of rl) {
            try {
                // Extract IP and email
                const ipAddress = extractIpAddress(line);
                const email = extractEmail(line);
                if (!ipAddress) continue;

                // Base key by IP address and serverName (no email yet)
                const baseKey = `${ipAddress}-${serverName}`;
                let visitorData = visitors.get(baseKey);

                if (!visitorData) {
                    // Create a new visitor entry
                    const geo = geoip.lookup(ipAddress);
                    visitorData = {
                        ip: ipAddress,
                        email: email || null,
                        server: serverName,
                        location: geo ? `${geo.city || ''}, ${geo.country || ''}`.trim().replace(/^,\s*/, '') : "Unknown",

                        // For time-based charts:
                        requestDailyCounts: generateDailyKeys(process.env.LOG_DISPLAY_MAX_DAYS || 30),
                        requestHourlyCounts: generateHourlyKeys(process.env.LOG_DISPLAY_MAX_HOURS || process.env.LOG_DISPLAY_MAX_DAYS * 24 || 48),

                        // Domain tracking
                        domains: {},
                    };
                    visitors.set(baseKey, visitorData);
                } else {
                    // Check if a valid email is found and update the email if it was null
                    if (email && !visitorData.email) {
                        visitorData.email = email;
                    }
                }

                // Extract timestamp & domain
                const timestamp = extractTimestamp(line);
                const domain = extractDomain(line);

                if (timestamp) {
                    const currentTime = Date.now();
                    const hoursAgo = Math.floor((currentTime - timestamp) / (1000 * 60 * 60));
                    const daysAgo = Math.floor(hoursAgo / 24);

                    // Update domain counts
                    if (domain) {
                        visitorData.domains[domain] = (visitorData.domains[domain] || 0) + 1;
                    }

                    // Update hourly counts if within 48 hours
                    if (hoursAgo >= 0 && hoursAgo < 48) {
                        const hourlyKey = getHourlyKey(hoursAgo);
                        visitorData.requestHourlyCounts[hourlyKey]++;
                    }

                    // Update daily counts if within 7 days
                    if (daysAgo >= 0 && daysAgo < 7) {
                        const dailyKey = getDailyKey(daysAgo);
                        visitorData.requestDailyCounts[dailyKey]++;
                    }
                }
            } catch (error) {
                console.error("Error parsing line:", error);
            }

        }

        // Close the file reader
        rl.close();
        await new Promise(resolve => fileStream.close(resolve));
    }

    return Array.from(visitors.values());
}

function getAllLogPaths(logDir) {
    if (!fs.existsSync(logDir)) {
        console.warn(`Log directory ${logDir} does not exist.`);
        return [];
    }
    return fs.readdirSync(logDir)
        .filter(fn => fn.startsWith('access.log'))
        .map(fn => path.join(logDir, fn));
}

// ------------- Helper Extractors ------------- //

function extractIpAddress(line) {
    // Matches IPv4 or bracketed IPv6 with port
    const regex = /\b(?:\d{1,3}\.){3}\d{1,3}|\[[0-9a-fA-F:]+\](?::\d{1,5})?\b/;
    const match = line.match(regex);
    if (!match) return null;
    // For IPv6 remove brackets if present
    return match[0].replace(/^\[|\]$/g, '');
}

function extractTimestamp(line) {
    // 2025/02/04 16:19:44 => convert to standard JS date
    const regex = /(\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2})/;
    const match = line.match(regex);
    if (match) {
        return new Date(match[1].replace(/\//g, '-')).getTime();
    }
    return null;
}

function extractDomain(line) {
    const regexTcp = /tcp:([a-zA-Z0-9.-]+)/;
    const regexUdp = /udp:([a-zA-Z0-9.-]+)/;
    const matchTcp = line.match(regexTcp);
    const matchUdp = line.match(regexUdp);
    return matchTcp ? matchTcp[1] : matchUdp ? matchUdp[1] : null;
}

function extractEmail(line) {
    // format email:(letters, numbers, punctuation, etc.)@domainname.domainsuffix
    // ((?!\.)[\w\-_.]*[^.])(@\w+)(\.\w+(\.\w+)?[^.\W])
    const regex = /email:((?!\.)[\w\-_.]*[^.])(@\w+)(\.\w+(\.\w+)?[^.\W])/;
    const match = line.match(regex);
    return match ? match[1] + match[2] + match[3] : null;
}

// ------------- Helper Key Generators ------------- //

function generateHourlyKeys(hours) {
    const now = new Date();
    const requestCounts = {};
    for (let i = 0; i < hours; i++) {
        const date = new Date(now.getTime() - i * 60 * 60 * 1000);
        const key = date.toISOString().slice(0, 13); // YYYY-MM-DDTHH
        requestCounts[key] = 0;
    }
    return requestCounts;
}

function generateDailyKeys(days) {
    const now = new Date();
    const requestCounts = {};
    for (let i = 0; i < days; i++) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const key = date.toISOString().slice(0, 10); // YYYY-MM-DD
        requestCounts[key] = 0;
    }
    return requestCounts;
}

function getHourlyKey(hoursAgo) {
    const date = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
    return date.toISOString().slice(0, 13); // YYYY-MM-DDTHH
}

function getDailyKey(daysAgo) {
    const date = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
    return date.toISOString().slice(0, 10); // YYYY-MM-DD
}

// ----------------------------------------------- //

module.exports = {
    parseMultipleV2RayLogs,
    getAllLogPaths
};

// // Usage example:
// const logPath = '/var/log/v2ray/access.log'; // Path to your log file
// parseMultipleV2RayLogs([logPath], 'DE').then(visitors => {
//     console.log('Recent unique visitors:', visitors);
// }).catch(error => {
//     console.error('Error parsing logs:', error);
// });