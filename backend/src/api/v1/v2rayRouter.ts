// /StackFusionZiyiliuTop/backend/src/api/v1/v2rayRouter.ts
import {Router} from "express"
import YAML from "yaml";
import {UserModel} from "models/user.model";

const proxyRouter = Router()
const SERVER_LIST: { name: string, server: string }[] = [
    {name: "ZLiu US proxy", server: "us.ziyiliu.top"},
    {name: "ZLiu DE proxy", server: "de.ziyiliu.top"}
];

/** Retrieve the Clash configuration based on the user's email
 * GET /api/v1/proxy/config?email=xxx@xxx.com&uuid=xxxxx
 * GET /api/v1/proxy/config/:uuid
 * GET /api/v1/proxy/config/:email
 * @param email: string
 * @param uuid: string
 */
proxyRouter.get(["/config", "/config/:uuid", "config/:email"], async (req, res): Promise<any> => {
    // Process Request Body (x-www-form-urlencoded) or Query Params (?email=xxx&uuid=xxx)
    const email: string = req.query.email || req.body.email || "";
    const uuid: string = req.query.uuid || req.body.uuid || "";
    if (email === "" && uuid === "") return res.status(400).send("Email or UUID is required");

    try {
        const user: UserModel | null = await new UserModel(uuid, email).fetchUser();

        if (!user || !user.uuid || !user.email || !user.v2_iter_id) return res.status(404).send("User not found");
        if (!user.isUserFriend()) return res.status(403).send("Permission denied");

        const yamlContent = generateClashYaml(user.email, user.uuid, user.v2_iter_id);
        // send non-downloadable text
        res.setHeader("Content-Type", "text/yaml");
        res.setHeader("Content-Disposition", `inline; filename=${email.slice(0, email.indexOf("@"))}.yaml`);
        res.send(yamlContent);
    } catch (error) {
        return res.status(500).send("Internal Server Error");
    }
});

// Function to generate the Clash YAML configuration based on UUID
function generateClashYaml(email: string, uuid: string, alterId: number) {
    const yamlConfig = {
        proxies: SERVER_LIST.map((server) => {
            return {
                name: server.name + " " + email.slice(0, email.indexOf("@")),
                type: "vmess",
                server: server.server,
                "server-name": server.server,
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
            type: "relay",
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
                path: "./RULE-SET/direct.yaml",
                interval: 86400
            },
            private: {
                type: "http",
                behavior: "domain",
                url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/private.txt",
                path: "./RULE-SET/private.yaml",
                interval: 86400
            },
            gfw: {
                type: "http",
                behavior: "domain",
                url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/gfw.txt",
                path: "./RULE-SET/gfw.yaml",
                interval: 86400
            },
            "tld-not-cn": {
                type: "http",
                behavior: "domain",
                url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/tld-not-cn.txt",
                path: "./RULE-SET/tld-not-cn.yaml",
                interval: 86400
            },
            telegramcidr: {
                type: "http",
                behavior: "ipcidr",
                url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/telegramcidr.txt",
                path: "./RULE-SET/telegramcidr.yaml",
                interval: 86400
            },
            cncidr: {
                type: "http",
                behavior: "ipcidr",
                url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/cncidr.txt",
                path: "./RULE-SET/cncidr.yaml",
                interval: 86400
            },
            lancidr: {
                type: "http",
                behavior: "ipcidr",
                url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/lancidr.txt",
                path: "./RULE-SET/lancidr.yaml",
                interval: 86400
            },
            applications: {
                type: "http",
                behavior: "classical",
                url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/applications.txt",
                path: "./RULE-SET/applications.yaml",
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

export default proxyRouter;