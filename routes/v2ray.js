const express = require("express");
const router = express.Router();
const YAML = require("yaml");
const {User} = require("../models/authentication");
SERVER_LIST = [
    {name: "ZLiu US proxy", server: "us.ziyiliu.top"},
    {name: "ZLiu DE proxy", server: "de.ziyiliu.top"}
];

// Function to generate the Clash YAML configuration based on UUID
function generateClashYaml(email, uuid, alterId) {
    const yamlConfig = {
        proxies: SERVER_LIST.map((server) => {
            return {
                name: server.name + " " + email.slice(0, email.indexOf("@")),
                type: "vmess",
                server: server.server,
                port: 443,
                uuid: uuid,
                alterId: alterId,
                cipher: "auto",
                tls: true,
                "skip-cert-verify": false,
                network: "ws",
                "ws-opts": {
                    path: "/v2ray",
                    headers: {
                        Host: server.server
                    }
                },
                sniffing: {
                    enabled: true,
                    "dest-override": ["http", "tls"]
                }
            };
        }),
        "proxy-groups": [{
            name: "ZLiu Proxy" + " " + email,
            type: "select",
            proxies: SERVER_LIST.map((server) => server.name + " " + email.slice(0, email.indexOf("@")))
        }],
        mode: "Rule",
        "rule-providers": {
            reject: {
                type: "http",
                behavior: "domain",
                url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/reject.txt",
                path: "./RULE-SET/reject.yaml",
                interval: 86400
            },
            icloud: {
                type: "http",
                behavior: "domain",
                url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/icloud.txt",
                path: "./RULE-SET/icloud.yaml",
                interval: 86400
            },
            apple: {
                type: "http",
                behavior: "domain",
                url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/apple.txt",
                path: "./RULE-SET/apple.yaml",
                interval: 86400
            },
            google: {
                type: "http",
                behavior: "domain",
                url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/google.txt",
                path: "./RULE-SET/google.yaml",
                interval: 86400
            },
            proxy: {
                type: "http",
                behavior: "domain",
                url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/proxy.txt",
                path: "./RULE-SET/proxy.yaml",
                interval: 86400
            },
            direct: {
                type: "http",
                behavior: "domain",
                url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/direct.txt",
                path: "./ruleset/direct.yaml",
                interval: 86400
            },
            private: {
                type: "http",
                behavior: "domain",
                url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/private.txt",
                path: "./ruleset/private.yaml",
                interval: 86400
            },
            gfw: {
                type: "http",
                behavior: "domain",
                url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/gfw.txt",
                path: "./ruleset/gfw.yaml",
                interval: 86400
            },
            "tld-not-cn": {
                type: "http",
                behavior: "domain",
                url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/tld-not-cn.txt",
                path: "./ruleset/tld-not-cn.yaml",
                interval: 86400
            },
            telegramcidr: {
                type: "http",
                behavior: "ipcidr",
                url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/telegramcidr.txt",
                path: "./ruleset/telegramcidr.yaml",
                interval: 86400
            },
            cncidr: {
                type: "http",
                behavior: "ipcidr",
                url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/cncidr.txt",
                path: "./ruleset/cncidr.yaml",
                interval: 86400
            },
            lancidr: {
                type: "http",
                behavior: "ipcidr",
                url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/lancidr.txt",
                path: "./ruleset/lancidr.yaml",
                interval: 86400
            },
            applications: {
                type: "http",
                behavior: "classical",
                url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/applications.txt",
                path: "./ruleset/applications.yaml",
                interval: 86400
            }
        },
        rules: [
            "RULE-SET,applications,DIRECT",
            "RULE-SET,private,DIRECT",
            "RULE-SET,direct,DIRECT",
            "RULE-SET,lancidr,DIRECT",
            "RULE-SET,cncidr,DIRECT",
            "RULE-SET,telegramcidr," + "ZLiu Proxy" + " " + email,

            "DOMAIN-SUFFIX,local,DIRECT",
            "DOMAIN,clash.razord.top,DIRECT",
            "DOMAIN,yacd.haishan.me,DIRECT",
            "RULE-SET,reject,REJECT",
            "RULE-SET,icloud,DIRECT",
            "RULE-SET,apple,DIRECT",
            "RULE-SET,google," + "ZLiu Proxy" + " " + email,
            "RULE-SET,proxy," + "ZLiu Proxy" + " " + email,
            "GEOIP,LAN,DIRECT",
            "GEOIP,CN,DIRECT",
            "DOMAIN-SUFFIX,.cn,DIRECT",
            "MATCH," + "ZLiu Proxy" + " " + email,
        ]
    };

    return YAML.stringify(yamlConfig);
}

// Route to generate YAML config for the given email
router.get("/config", async (req, res) => {
    const email = req.query.email;

    if (!email) {
        console.log("Email parameter is missing");
        return res.status(400).send("Email parameter is required");
    }

    try {
        const user = new User(null, email);
        await user.fetchUser();

        if (!user || !user.uuid || !user.v2_iter_id) {
            console.log("User not found or missing required fields:", email);
            return res.status(404).send("User not found");
        }

        const {uuid, v2_iter_id: alterId} = user;
        const yamlContent = generateClashYaml(email, uuid, alterId);

        // console.log("The user info from db is:", user);

        res.header("Content-Type", "text/yaml");
        res.send(yamlContent);
    } catch (error) {
        console.error("Error fetching user or generating YAML:", error);
        res.status(500).send("Internal Server Error");
    }
});

module.exports = router;

