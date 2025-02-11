// /script/v2rayLogParser.js
const fs = require("fs");
const path = require("path");
const readline = require("readline");
const geoip = require('geoip-lite');
const zlib = require("zlib");

async function parseV2RayLogFile(filePath, serverName) {
    if (!fs.existsSync(filePath)) {
        return [];
    }
    const isGzipped = filePath.endsWith(".gz");
    const fileStream = isGzipped
        ? fs.createReadStream(filePath).pipe(zlib.createGunzip())
        : fs.createReadStream(filePath);

    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    const visitorData = [];
    for await (const line of rl) {
        try {
            if (!line || !/ accepted /.test(line)) continue;
            let [date, time, ipPort, status, domainIp, label, email] = line.split(" ");
            if (!date || !time || !ipPort || !status || !domainIp || !label || !email) {
                console.error([date, time, ipPort, status, domainIp, label, email].join("\t"));
                continue;
            }
            const visitTime = new Date(`${date} ${time}`).getTime();
            const userIp = extractIpAddress(ipPort);
            const geo = geoip.lookup(userIp);
            const userLocation = geo ? `${geo.city || ''}, ${geo.country || ''}`.trim().replace(/^,\s*/, '') : "Unknown";
            const visitProtocol = domainIp.split(":")[0];
            const visitDomain = extractDomain(domainIp);
            const visitLabel = label.replace(/[\[\]]/g, "");
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
    rl.close();
    await new Promise(resolve => {
        if (isGzipped) fileStream.unpipe();
        fileStream.on('close', resolve);
        fileStream.destroy();
    });
    return visitorData;
}

async function parseMultipleV2RayLogs(filePaths, serverName, progressCallback) {
    const promises = filePaths.map(async (filePath) => {
        if (!fs.existsSync(filePath)) return [];
        const logs = await parseV2RayLogFile(filePath, serverName);
        if (progressCallback) progressCallback(filePath, logs);
        return logs;
    });
    const results = await Promise.all(promises);
    return results.flat();
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
    const ipRegex = /\b(?:\d{1,3}\.){3}\d{1,3}|\[[0-9a-fA-F:]+\](?::\d{1,5})?\b/;
    const domainRegex = /([a-zA-Z0-9.-]+):/;
    const match = ipWithPortLabel.match(ipRegex) || ipWithPortLabel.match(domainRegex);
    return match ? match[0].replace(/[\[\]]/g, '') : null;
}

function extractDomain(domainIpWithPortProtocol) {
    const regexTcp = /tcp:([a-zA-Z0-9.-]+)/;
    const regexUdp = /udp:([a-zA-Z0-9.-]+)/;
    const matchTcp = domainIpWithPortProtocol.match(regexTcp);
    const matchUdp = domainIpWithPortProtocol.match(regexUdp);
    return matchTcp ? matchTcp[1] : matchUdp ? matchUdp[1] : null;
}

module.exports = {
    parseV2RayLogFile,
    parseMultipleV2RayLogs,
    getAllLogPaths
};
