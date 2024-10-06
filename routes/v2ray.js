const express = require('express');
const router = express.Router();
const YAML = require('yaml');


// In-memory data for users with UUIDs (You can replace this with a database)
const userData = {
    'lavandejoey@outlook.com': '62a499c2-baa8-4182-ba61-f26010ec985c',
    'lzy_ecust@outlook.com': '3f056acf-48af-464c-8e91-b96501c529f4',
    'chenxingxingbiu@163.com': '36f2f038-711e-4d82-85fb-8c16b3848a10',
    "1136243186@qq.com": "2443b8bb-adff-4b62-98c4-20710a7f86d0"
};

// Function to generate the Clash YAML configuration based on UUID
function generateClashYaml(email, uuid) {
    const yamlConfig = {
        proxies: [
            {
                name: 'ZLiu v2ray service',
                type: 'vmess',
                server: 'v2ray.ziyiliu.top',
                port: 443,
                uuid: uuid, // UUID is dynamic
                alterId: 0,
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
                path: './ruleset/reject.yaml',
                interval: 86400
            },
            icloud: {
                type: 'http',
                behavior: 'domain',
                url: 'https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/icloud.txt',
                path: './ruleset/icloud.yaml',
                interval: 86400
            },
            apple: {
                type: 'http',
                behavior: 'domain',
                url: 'https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/apple.txt',
                path: './ruleset/apple.yaml',
                interval: 86400
            },
            google: {
                type: 'http',
                behavior: 'domain',
                url: 'https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/google.txt',
                path: './ruleset/google.yaml',
                interval: 86400
            },
            proxy: {
                type: 'http',
                behavior: 'domain',
                url: 'https://cdn.jsdelivr.net/gh/Loyalsoldier/clash-rules@release/proxy.txt',
                path: './ruleset/proxy.yaml',
                interval: 86400
            }
        },
        rules: [
            'DOMAIN-SUFFIX,local,DIRECT',
            'RULE-SET,applications,DIRECT',
            'DOMAIN,clash.razord.top,DIRECT',
            'DOMAIN,yacd.haishan.me,DIRECT',
            'RULE-SET,private,DIRECT',
            'RULE-SET,reject,REJECT',
            'RULE-SET,icloud,DIRECT',
            'RULE-SET,apple,DIRECT',
            'RULE-SET,google,ZLiu v2ray service',
            'RULE-SET,proxy,ZLiu v2ray service',
            'RULE-SET,direct,DIRECT',
            'RULE-SET,lancidr,DIRECT',
            'RULE-SET,cncidr,DIRECT',
            'RULE-SET,telegramcidr,ZLiu v2ray service',
            'GEOIP,LAN,DIRECT',
            'GEOIP,CN,DIRECT',
            'DOMAIN-SUFFIX,.cn,DIRECT',
            'MATCH,ZLiu v2ray service'
        ]
    };

    return YAML.stringify(yamlConfig);
}

// Route to generate YAML config for the given email
router.get('/config', (req, res) => {
    const email = req.query.email;
    const clash = req.query.clash;

    if (clash !== 1) {
        return res.status(404).send('User not found');
    }
    if (!email || !userData[email]) {
        return res.status(404).send('User not found');
    }

    const uuid = userData[email];
    const yamlContent = generateClashYaml(email, uuid);

    res.header('Content-Type', 'text/yaml');
    res.send(yamlContent);
});

module.exports = router;