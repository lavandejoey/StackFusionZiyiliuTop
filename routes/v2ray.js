const express = require('express');
const router = express.Router();
const YAML = require('yaml');


// In-memory data for users with UUIDs (You can replace this with a database)
const userData = {
    'lavandejoey@outlook.com': '62a499c2-baa8-4182-ba61-f26010ec985c',
    'lzy_ecust@outlook.com': '3f056acf-48af-464c-8e91-b96501c529f4',
    'chenxingxingbiu@163.com': '36f2f038-711e-4d82-85fb-8c16b3848a10',
    '1136243186@qq.com': '2443b8bb-adff-4b62-98c4-20710a7f86d0'
};
const alterIds = {
    'lavandejoey@outlook.com': 69,
    'lzy_ecust@outlook.com': 43,
    'chenxingxingbiu@163.com': 314,
    '1136243186@qq.com': 77
}

// Function to generate the Clash YAML configuration based on UUID
function generateClashYaml(email, uuid, alterId) {
    const yamlConfig = {
        proxies: [
            {
                name: 'ZLiu v2ray service' + ' ' + email,
                type: 'vmess',
                server: 'v2ray.ziyiliu.top',
                port: 443,
                uuid: uuid, // UUID is dynamic
                alterId: alterId, // AlterId is dynamic
                cipher: 'auto',
                tls: true,
                'skip-cert-verify': false,
                network: 'ws',
                'ws-opts': {
                    path: '/v2ray',
                    headers: {
                        Host: 'v2ray.ziyiliu.top'
                    }
                },
                sniffing: {
                    enabled: true,
                    'dest-override': ['http', 'tls']
                }
            },
        ],
        mode: 'Rule',
        'rule-providers': {
            reject: {
                type: 'http',
                behavior: 'domain',
                url: 'https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/reject.txt',
                path: './RULE-SET/reject.yaml',
                interval: 86400
            },
            icloud: {
                type: 'http',
                behavior: 'domain',
                url: 'https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/icloud.txt',
                path: './RULE-SET/icloud.yaml',
                interval: 86400
            },
            apple: {
                type: 'http',
                behavior: 'domain',
                url: 'https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/apple.txt',
                path: './RULE-SET/apple.yaml',
                interval: 86400
            },
            google: {
                type: 'http',
                behavior: 'domain',
                url: 'https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/google.txt',
                path: './RULE-SET/google.yaml',
                interval: 86400
            },
            proxy: {
                type: 'http',
                behavior: 'domain',
                url: 'https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/proxy.txt',
                path: './RULE-SET/proxy.yaml',
                interval: 86400
            },
            direct: {
                type: 'http',
                behavior: 'domain',
                url: 'https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/direct.txt',
                path: './ruleset/direct.yaml',
                interval: 86400
            },
            private: {
                type: 'http',
                behavior: 'domain',
                url: 'https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/private.txt',
                path: './ruleset/private.yaml',
                interval: 86400
            },
            gfw: {
                type: 'http',
                behavior: 'domain',
                url: 'https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/gfw.txt',
                path: './ruleset/gfw.yaml',
                interval: 86400
            },
            'tld-not-cn': {
                type: 'http',
                behavior: 'domain',
                url: 'https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/tld-not-cn.txt',
                path: './ruleset/tld-not-cn.yaml',
                interval: 86400
            },
            telegramcidr: {
                type: 'http',
                behavior: 'ipcidr',
                url: 'https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/telegramcidr.txt',
                path: './ruleset/telegramcidr.yaml',
                interval: 86400
            },
            cncidr: {
                type: 'http',
                behavior: 'ipcidr',
                url: 'https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/cncidr.txt',
                path: './ruleset/cncidr.yaml',
                interval: 86400
            },
            lancidr: {
                type: 'http',
                behavior: 'ipcidr',
                url: 'https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/lancidr.txt',
                path: './ruleset/lancidr.yaml',
                interval: 86400
            },
            applications: {
                type: 'http',
                behavior: 'classical',
                url: 'https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/applications.txt',
                path: './ruleset/applications.yaml',
                interval: 86400
            }
        },
        rules: [
            'RULE-SET,applications,DIRECT',
            'RULE-SET,private,DIRECT',
            'RULE-SET,direct,DIRECT',
            'RULE-SET,lancidr,DIRECT',
            'RULE-SET,cncidr,DIRECT',
            'RULE-SET,telegramcidr,' + 'ZLiu v2ray service' + ' ' + email,

            'DOMAIN-SUFFIX,local,DIRECT',
            'DOMAIN,clash.razord.top,DIRECT',
            'DOMAIN,yacd.haishan.me,DIRECT',
            'RULE-SET,reject,REJECT',
            'RULE-SET,icloud,DIRECT',
            'RULE-SET,apple,DIRECT',
            'RULE-SET,google,' + 'ZLiu v2ray service' + ' ' + email,
            'RULE-SET,proxy,' + 'ZLiu v2ray service' + ' ' + email,
            'GEOIP,LAN,DIRECT',
            'GEOIP,CN,DIRECT',
            'DOMAIN-SUFFIX,.cn,DIRECT',
            'MATCH,' + 'ZLiu v2ray service' + ' ' + email
        ]
    };

    return YAML.stringify(yamlConfig);
}

// Route to generate YAML config for the given email
router.get('/config', (req, res) => {
    const email = req.query.email;

    if (!email || !userData[email]) {
        console.log('Invalid request: ', req.query);
        return res.status(404).send('User not found');
    }

    const uuid = userData[email];
    const alterId = alterIds[email];
    const yamlContent = generateClashYaml(email, uuid, alterId);

    res.header('Content-Type', 'text/yaml');
    res.send(yamlContent);
});

module.exports = router;
