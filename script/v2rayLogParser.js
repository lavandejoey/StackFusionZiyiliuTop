const fs = require("fs");
const readline = require("readline");
const geoip = require('geoip-lite');

// Function to parse log files and extract recent unique visitors and their domain visits
async function v2rayLogParser(filePath, maxVisitors = 10) {
    const visitors = new Map();

    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    for await (const line of rl) {
        try {
            // Extract IP address from the log line (handles both IPv4 and IPv6)
            const ipAddress = extractIpAddress(line);
            if (!ipAddress) continue;

            if (!visitors.has(ipAddress)) {
                const geo = geoip.lookup(ipAddress);
                visitors.set(ipAddress, {
                    ip: ipAddress,
                    location: geo ? `${geo.city}, ${geo.country}` : "Unknown",
                    requestHourlyCounts: generateHourlyKeys(48), // 2 days * 24 hours
                    requestDailyCounts: generateDailyKeys(7),    // 7 days
                    requestHourlyDomains: {} // Initialize domain tracking with an empty object
                });
            }

            // Extract timestamp from log line and update request count
            const timestamp = extractTimestamp(line);
            if (timestamp) {
                const currentTime = Date.now();
                const hoursAgo = Math.floor((currentTime - timestamp) / (1000 * 60 * 60));

                // Handle domain extraction
                const domain = extractDomain(line);
                if (domain) {
                    const hourlyKey = getHourlyKey(hoursAgo);
                    const visitorData = visitors.get(ipAddress);

                    // Ensure requestHourlyDomains has the key
                    if (!visitorData.requestHourlyDomains[hourlyKey]) {
                        visitorData.requestHourlyDomains[hourlyKey] = {};
                    }

                    // Increment the count for the domain, or initialize it
                    if (!visitorData.requestHourlyDomains[hourlyKey][domain]) {
                        visitorData.requestHourlyDomains[hourlyKey][domain] = 1;
                    } else {
                        visitorData.requestHourlyDomains[hourlyKey][domain]++;
                    }

                    // Update request counts
                    if (hoursAgo >= 0 && hoursAgo < 48) {
                        visitorData.requestHourlyCounts[hourlyKey]++;
                    }
                }
            }
        } catch (error) {
            console.error('Error parsing line:', error);
        }

        // Stop if we have collected enough unique visitors
        if (visitors.size >= maxVisitors) {
            break;
        }
    }

    return Array.from(visitors.values());
}

// Helper function to extract IP address from log line (updated for IPv6 support)
function extractIpAddress(line) {
    const regex = /\b(?:\d{1,3}\.){3}\d{1,3}|\[[0-9a-fA-F:]+\]/;
    const match = line.match(regex);
    return match ? match[0] : null;
}

// Helper function to extract domain from log line
function extractDomain(line) {
    const regex = /tcp:([a-zA-Z0-9.-]+)/; // Adjust to match domain portion in log line
    const match = line.match(regex);
    return match ? match[1] : null;
}

// Helper function to extract timestamp from log line (updated for yyyy/mm/dd format)
function extractTimestamp(line) {
    const regex = /(\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2})/;
    const match = line.match(regex);
    if (match) {
        const dateStr = match[1];
        return new Date(dateStr.replace(/\//g, '-')).getTime();
    }
    return null;
}

// Helper function to generate hourly keys for requestHourlyCounts and requestHourlyDomains
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

// Helper function to generate daily keys for requestDailyCounts
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

// Helper function to get the hourly key based on hours ago
function getHourlyKey(hoursAgo) {
    const date = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
    return date.toISOString().slice(0, 13); // YYYY-MM-DDTHH
}

// Exporting the function for use in other files
module.exports = {v2rayLogParser};

// // Usage example:
// const logPath = '/var/log/v2ray/access.log'; // Path to your log file
// v2rayLogParser(logPath, 10).then(visitors => {
//     console.log('Recent unique visitors:', visitors);
// }).catch(error => {
//     console.error('Error parsing logs:', error);
// });