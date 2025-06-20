// /StackFusionZiyiliuTop/backend/src/api/v1/v2rayRouter.ts
import {Request, Response, Router} from "express";
import YAML from "yaml";
import UserService from "@src/services/UserService";
import {errorResponse} from "@src/common/util/response";
import {UserRoleEnum, UserStatusEnum} from "@src/types/users";
import HttpStatusCodes from "@src/common/constants/HttpStatusCodes";

export const proxyRouter = Router();
const SERVER_LIST: { name: string, server: string }[] = [
    {name: "ZLiu US proxy", server: "us.ziyiliu.top"},
    {name: "ZLiu DE proxy", server: "de.ziyiliu.top"},
];

/** Retrieve the Proxy Config by Email
 * GET /api/v1/proxy/config?email=xxx@xxx.com
 * GET /api/v1/proxy/config/:email
 * @param email: string
 */
proxyRouter.get(["/config", "config/:email"], async (req: Request, res: Response) => {
    // Process Request Body (x-www-form-urlencoded) or Query Params (?email=xxx&uuid=xxx)
    const email: string = typeof req.query?.email === "string" ? req.query.email : req.params.email ?? "";
    if (email === "") res.status(HttpStatusCodes.BAD_REQUEST)
        .send(errorResponse(req, res, "Email is required"));

    try {
        const user = await UserService.getSelfProfile(undefined, email);

        if (!user?.uuid || !user?.email || !user?.v2_iter_id) {
            res.status(HttpStatusCodes.NOT_FOUND)
                .send(errorResponse(req, res, "User not found or incomplete user data"));
            return;
        } else if (
            (await UserService.hasRolesOr(user.uuid, [UserRoleEnum.USER_FRIEND, UserRoleEnum.ADMIN])) &&
            !(user.status === UserStatusEnum.ACTIVE)) {
            res.status(HttpStatusCodes.UNAUTHORIZED)
                .send(errorResponse(req, res, "Access denied: User is not a friend or admin"));
            return;
        } else {
            const yamlContent = generateClashYaml(user.email, user.uuid, user.v2_iter_id);
            const filename = `${user.email.split("@")[0]}.yaml`;
            res.setHeader("Cache-Control", "no-cache");
            // Use a standard YAML MIME type
            res.setHeader("Content-Type", "application/x-yaml");
            // Prevent MIME sniffing
            res.setHeader("X-Content-Type-Options", "nosniff");
            res.setHeader("Content-Disposition", `inline; filename=${filename}`);
            // Send the file
            res.status(HttpStatusCodes.OK).send(yamlContent);
        }
    } catch (error) {
        res
            .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
            .send(errorResponse(req, res,
                error instanceof Error ? error.message : "An error occurred while generating the proxy config"));
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
                        Host: server.server,
                    },
                },
                sniffing: {
                    enabled: true,
                    "dest-override": ["http", "tls"],
                },
            };
        }),
        "proxy-groups": [{
            name: "ZLiu Proxy" + " " + email,
            type: "relay",
            proxies: SERVER_LIST.map((server) =>
                server.name + " " + email.slice(0, email.indexOf("@"))),
        }],
        mode: "Rule",
        "rule-providers": {
            reject: {
                type: "http",
                behavior: "domain",
                url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/reject.txt",
                path: "./RULE-SET/reject.yaml",
                interval: 86400,
            },
            icloud: {
                type: "http",
                behavior: "domain",
                url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/icloud.txt",
                path: "./RULE-SET/icloud.yaml",
                interval: 86400,
            },
            apple: {
                type: "http",
                behavior: "domain",
                url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/apple.txt",
                path: "./RULE-SET/apple.yaml",
                interval: 86400,
            },
            google: {
                type: "http",
                behavior: "domain",
                url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/google.txt",
                path: "./RULE-SET/google.yaml",
                interval: 86400,
            },
            proxy: {
                type: "http",
                behavior: "domain",
                url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/proxy.txt",
                path: "./RULE-SET/proxy.yaml",
                interval: 86400,
            },
            direct: {
                type: "http",
                behavior: "domain",
                url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/direct.txt",
                path: "./RULE-SET/direct.yaml",
                interval: 86400,
            },
            private: {
                type: "http",
                behavior: "domain",
                url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/private.txt",
                path: "./RULE-SET/private.yaml",
                interval: 86400,
            },
            gfw: {
                type: "http",
                behavior: "domain",
                url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/gfw.txt",
                path: "./RULE-SET/gfw.yaml",
                interval: 86400,
            },
            "tld-not-cn": {
                type: "http",
                behavior: "domain",
                url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/tld-not-cn.txt",
                path: "./RULE-SET/tld-not-cn.yaml",
                interval: 86400,
            },
            telegramcidr: {
                type: "http",
                behavior: "ipcidr",
                url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/telegramcidr.txt",
                path: "./RULE-SET/telegramcidr.yaml",
                interval: 86400,
            },
            cncidr: {
                type: "http",
                behavior: "ipcidr",
                url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/cncidr.txt",
                path: "./RULE-SET/cncidr.yaml",
                interval: 86400,
            },
            lancidr: {
                type: "http",
                behavior: "ipcidr",
                url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/lancidr.txt",
                path: "./RULE-SET/lancidr.yaml",
                interval: 86400,
            },
            applications: {
                type: "http",
                behavior: "classical",
                url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/applications.txt",
                path: "./RULE-SET/applications.yaml",
                interval: 86400,
            },
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
        ],
    };
    return YAML.stringify(yamlConfig);
}
