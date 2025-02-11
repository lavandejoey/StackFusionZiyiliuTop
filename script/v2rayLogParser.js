const fs = require("fs");
const path = require("path");
const readline = require("readline");
const geoip = require('geoip-lite');
const zlib = require("zlib");

async function parseMultipleV2RayLogs(filePaths, serverName) {
    let visitorData = [];

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
                // Ensure the line is not empty and with " accepted "
                if (!line || / accepted /.test(line) === false) continue;

                // Extract datetime, ip, visited domain, label
                let [date, time, ipPort, status, domainIp, label, email] = String(line).split(" ");

                if (!date || !time || !ipPort || !status || !domainIp || !label || !email) {
                    console.error([date, time, ipPort, status, domainIp, label, email].join("\t"));
                    continue;
                }

                // date & time -> js std time
                const visitTime = new Date(`${date} ${time}`).getTime();

                // ipPort -> ip / domainPort -> domain
                const userIp = extractIpAddress(ipPort);
                const geo = geoip.lookup(userIp);
                const userLocation = geo ? `${geo.city || ''}, ${geo.country || ''}`.trim().replace(/^,\s*/, '') : "Unknown";
                const visitProtocol = domainIp.split(":")[0]; // tcp / udp
                const visitDomain = extractDomain(domainIp);

                // label
                const visitLabel = label.replace(/[\[\]]/g, ""); // remove brackets
                // userEmail
                const userEmail = email.replace("email:", "");

                visitorData.push({
                    email: userEmail,
                    ip: userIp,
                    location: userLocation,
                    time: visitTime,
                    label: visitLabel,
                    protocol: visitProtocol,
                    domain: visitDomain,
                    server: serverName
                });
            } catch (error) {
                console.error("Error parsing line:", error);
            }
        }
        // Close the file reader
        rl.close();
        await new Promise(resolve => fileStream.close(resolve));
    }

    return visitorData;
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

function extractIpAddress(ipWithPortLabel) {
    // Matches IPv4 or bracketed IPv6 with port
    const ipRegex = /\b(?:\d{1,3}\.){3}\d{1,3}|\[[0-9a-fA-F:]+\](?::\d{1,5})?\b/;
    const domainRegex = /([a-zA-Z0-9.-]+):/;
    const match = ipWithPortLabel.match(ipRegex) || ipWithPortLabel.match(domainRegex);
    // For IPv6 remove brackets if present
    return match ? match[0].replace(/[\[\]]/g, '') : null;
}

function extractDomain(domainIpWithPortProtocol) {
    const regexTcp = /tcp:([a-zA-Z0-9.-]+)/;
    const regexUdp = /udp:([a-zA-Z0-9.-]+)/;
    const matchTcp = domainIpWithPortProtocol.match(regexTcp);
    const matchUdp = domainIpWithPortProtocol.match(regexUdp);
    return matchTcp ? matchTcp[1] : matchUdp ? matchUdp[1] : null;
}

// ----------------------------------------------- //

module.exports = {
    parseMultipleV2RayLogs,
    getAllLogPaths
};

// // Usage example:
// const logPath = '/var/log/v2ray'; // Path to your log file
// parseMultipleV2RayLogs(getAllLogPaths(logPath), 'DE').then(visitors => {
//     console.log('Recent unique visitors:', visitors);
// }).catch(error => {
//     console.error('Error parsing logs:', error);
// });