module.exports = {
    apps: [
        {
            name: "APIs",
            cwd: "./apps/backend",
            script: "node",
            args: "-r ./dist/config.js ./dist/index.js",
            instances: 1,
            autorestart: true,
            watch: false,
            max_memory_restart: "512M",
            env: {
                NODE_ENV: "production",
                REPO_CACHE_OVERWRITE: "false",
            },
        },
        {
            name: "ziyiliu",
            cwd: "./apps/frontend",
            script: "npm",
            args: "run preview -- --host 0.0.0.0",
            instances: 1,
            autorestart: true,
            watch: false,
            max_memory_restart: "512M",
            env: {
                NODE_ENV: "production",
            },
        },
    ],
};
