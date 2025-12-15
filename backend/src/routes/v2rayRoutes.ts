// /StackFusionZiyiliuTop/backend/src/routes/v2rayRoutes.ts
import {Request, Response, Router} from "express";
import YAML from "yaml";
import UserService from "@src/services/UserService";
import {errorResponse} from "@src/common/util/response";
import {UserRoleEnum, UserStatusEnum} from "@src/types/users";
import HttpStatusCodes from "@src/common/constants/HttpStatusCodes";
import {ENDPOINTS} from "@src/common/constants/ENDPOINTS";
import {
    REALITY_PUBLIC_KEY,
    REALITY_SHORT_ID,
    XRAY_WS_SERVERS,
    REALITY_SERVERS,
} from "@src/common/constants/ENV";

export const proxyRouter = Router();

const LOCATION_MAP: Record<string, string> = {
    "CN": "CN-上海",
    "US": "US-Penn.",
    "DE": "DE-BaWü",
};

function getNodeName(regionKey: string, type: "Stable" | "Turbo"): string {
    const prettyRegion = LOCATION_MAP[regionKey] || regionKey;
    return `ZLiu ${prettyRegion} ${type}`;
}


/** * Retrieve the Proxy Config by Email (Available for Users on Clash / Shadowrocket)
 * GET /api/v1/proxy/config?email=xxx@xxx.com
 */
proxyRouter.get(ENDPOINTS.proxy.config, async (req: Request, res: Response) => {
    const email: string = typeof req.query?.email === "string" ? req.query.email : req.params.email ?? "";

    if (email === "") {
        res.status(HttpStatusCodes.BAD_REQUEST).send(errorResponse(req, res, "Email is required"));
        return;
    }

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
            // Generate the YAML content
            const yamlContent = generateClashYaml(user.email, user.uuid);
            const filename = `${user.email.split("@")[0]}.yaml`;

            res.setHeader("Cache-Control", "no-cache");
            res.setHeader("Content-Type", "application/x-yaml");
            res.setHeader("X-Content-Type-Options", "nosniff");
            res.setHeader("Content-Disposition", `inline; filename=${filename}`);

            res.status(HttpStatusCodes.OK).send(yamlContent);
        }
    } catch (error) {
        res
            .status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
            .send(errorResponse(req, res,
                error instanceof Error ? error.message : "An error occurred while generating the proxy config"));
    }
});

/**
 * Build Rules and Providers
 */
function buildRuleSection(email: string) {
    email.slice(0, email.indexOf("@"));
    const mainProxyGroup = "ZLiu All Proxy List";
    const cnAutoGroup = `ZLiu ${LOCATION_MAP.CN} Auto Select`;

    const ruleProviders = {
        reject: {
            type: "http", behavior: "domain", interval: 86400,
            url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/reject.txt",
            path: "./RULE-SET/reject.yaml",
        },
        icloud: {
            type: "http", behavior: "domain", interval: 86400,
            url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/icloud.txt",
            path: "./RULE-SET/icloud.yaml",
        },
        apple: {
            type: "http", behavior: "domain", interval: 86400,
            url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/apple.txt",
            path: "./RULE-SET/apple.yaml",
        },
        google: {
            type: "http", behavior: "domain", interval: 86400,
            url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/google.txt",
            path: "./RULE-SET/google.yaml",
        },
        proxy: {
            type: "http", behavior: "domain", interval: 86400,
            url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/proxy.txt",
            path: "./RULE-SET/proxy.yaml",
        },
        direct: {
            type: "http", behavior: "domain", interval: 86400,
            url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/direct.txt",
            path: "./RULE-SET/direct.yaml",
        },
        private: {
            type: "http", behavior: "domain", interval: 86400,
            url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/private.txt",
            path: "./RULE-SET/private.yaml",
        },
        gfw: {
            type: "http", behavior: "domain", interval: 86400,
            url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/gfw.txt",
            path: "./RULE-SET/gfw.yaml",
        },
        "tld-not-cn": {
            type: "http", behavior: "domain", interval: 86400,
            url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/tld-not-cn.txt",
            path: "./RULE-SET/tld-not-cn.yaml",
        },
        telegramcidr: {
            type: "http", behavior: "ipcidr", interval: 86400,
            url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/telegramcidr.txt",
            path: "./RULE-SET/telegramcidr.yaml",
        },
        cncidr: {
            type: "http", behavior: "ipcidr", interval: 86400,
            url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/cncidr.txt",
            path: "./RULE-SET/cncidr.yaml",
        },
        lancidr: {
            type: "http", behavior: "ipcidr", interval: 86400,
            url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/lancidr.txt",
            path: "./RULE-SET/lancidr.yaml",
        },
        applications: {
            type: "http", behavior: "classical", interval: 86400,
            url: "https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/applications.txt",
            path: "./RULE-SET/applications.yaml",
        },
    };

    const rules = [
        "RULE-SET,applications,DIRECT",
        "RULE-SET,private,DIRECT",
        "RULE-SET,direct,DIRECT",
        "RULE-SET,lancidr,DIRECT",
        "RULE-SET,cncidr,DIRECT",
        "RULE-SET,telegramcidr," + mainProxyGroup,

        "DOMAIN-SUFFIX,local,DIRECT",
        "DOMAIN,clash.razord.top,DIRECT",
        "DOMAIN,yacd.haishan.me,DIRECT",
        "RULE-SET,reject,REJECT",
        "RULE-SET,icloud,DIRECT",
        "RULE-SET,apple,DIRECT",
        "RULE-SET,google," + mainProxyGroup,
        "RULE-SET,proxy," + mainProxyGroup,
        "GEOIP,LAN,DIRECT",
        "GEOIP,CN,DIRECT",
        `DOMAIN-SUFFIX,.cn,${cnAutoGroup}`,
        `MATCH,${mainProxyGroup}`,
    ];

    return {ruleProviders, rules};
}

/**
 * Generate a unified Clash YAML config
 */
export function generateClashYaml(
    email: string,
    uuid: string,
): string {
    email.slice(0, email.indexOf("@"));
    // Generate Norm Proxies (VLESS + WS + TLS)
    const uniqueNormServers = XRAY_WS_SERVERS.filter(
        (v, i, a) => a.findIndex(t => (t.name === v.name && t.server === v.server)) === i,
    );

    const normProxies = uniqueNormServers.map((server) => {
        // Ensure we get a single string address for WS domains
        const address = Array.isArray(server.server) ? server.server[0] : server.server;

        return {
            name: getNodeName(server.name, "Stable"),
            type: "vless",
            server: address,
            "server-name": address,
            servername: address,
            port: 443,
            uuid,
            udp: true,
            tls: true,
            "skip-cert-verify": false,
            network: "ws",
            "client-fingerprint": "chrome",
            "ws-opts": {
                path: "/xray",
            },
            sniffing: {
                enabled: true,
                "dest-override": ["http", "tls"],
            },
        };
    });

    // Generate Stream Proxies (REALITY)
    const streamProxies = REALITY_SERVERS.map((server) => {
        const ipList = Array.isArray(server.server) ? server.server : [server.server as string];
        const ipv4 = ipList.find(addr => !addr.includes(":")) ?? ipList[0];

        return {
            name: getNodeName(server.name, "Turbo"),
            type: "vless",
            server: ipv4,
            port: 8443,
            uuid,
            udp: true,
            tls: true,
            network: "tcp",
            flow: "xtls-rprx-vision",
            servername: server.sni,
            "client-fingerprint": "chrome",
            "skip-cert-verify": false,
            "reality-opts": {
                "public-key": REALITY_PUBLIC_KEY,
                "short-id": REALITY_SHORT_ID,
            },
            sniffing: {
                enabled: true,
                "dest-override": ["http", "tls"],
            },
        };
    });

    const allProxies = [...normProxies, ...streamProxies];

    const mainProxyGroupName = "ZLiu All Proxy List";
    const globalAutoGroupName = "ZLiu Global Auto Select";

    // Helper: Filter proxies by region key (CN, US, DE)
    const getProxiesByRegion = (regionKey: string) =>
        allProxies
            .filter(p => p.name.includes(LOCATION_MAP[regionKey]))
            .map(p => p.name);

    // Regional Auto Groups (CN, US, DE)
    const regionalGroups = [
        {
            name: `ZLiu ${LOCATION_MAP.CN} Auto Select`,
            type: "url-test",
            url: "https://www.baidu.com/generate_204",
            interval: 300,
            proxies: getProxiesByRegion("CN"),
        },
        {
            name: `ZLiu ${LOCATION_MAP.US} Auto Select`,
            type: "url-test",
            url: "https://www.gstatic.com/generate_204",
            interval: 300,
            proxies: getProxiesByRegion("US"),
        },
        {
            name: `ZLiu ${LOCATION_MAP.DE} Auto Select`,
            type: "url-test",
            url: "https://www.gstatic.com/generate_204",
            interval: 300,
            proxies: getProxiesByRegion("DE"),
        },
    ];

    // Global Auto Group (Excluding CN to avoid slowing down Google)
    const globalAutoGroup = {
        name: globalAutoGroupName,
        type: "url-test",
        url: "https://www.gstatic.com/generate_204",
        interval: 300,
        proxies: [
            ...getProxiesByRegion("US"),
            ...getProxiesByRegion("DE"),
        ],
    };

    // Main Select Group (Root)
    const mainSelectGroup = {
        name: mainProxyGroupName,
        type: "select",
        proxies: [
            globalAutoGroupName,
            ...regionalGroups.map(g => g.name),
            ...allProxies.map(p => p.name),
        ],
    };

    const proxyGroups = [
        mainSelectGroup,
        globalAutoGroup,
        ...regionalGroups,
    ];

    // Build Rule Section
    const {ruleProviders, rules} = buildRuleSection(email);

    // Construct Final YAML
    const yamlConfig = {
        proxies: allProxies,
        "proxy-groups": proxyGroups,
        mode: "rule",
        "rule-providers": ruleProviders,
        rules,
    };

    return YAML.stringify(yamlConfig);
}
