module.exports = {
    apps: [
        {
            name: "spade-api",
            cwd: "./api",
            script: "./build/index.js",
            args: ":prod -- --port 3000",
            node_args: "--max-old-space-size=2048",
            exec_mode: "cluster",
            max_memory_restart: "2G"
        },
        {
            name: "spade-admin",
            cwd: "./admin",
            script: "node_modules/next/dist/bin/next",
            args: "start -- --port 3001",
            node_args: "--max-old-space-size=512",
            exec_mode: "cluster",
            max_memory_restart: "512M"
        },
        {
            name: "spade-frontend",
            cwd: "./frontend",
            script: "node_modules/next/dist/bin/next",
            args: "start -- --port 3002",
            node_args: "--max-old-space-size=512",
            exec_mode: "cluster",
            max_memory_restart: "512M"
        },
        {
            name: "spade-landing-register-01",
            cwd: "./landing-register-01",
            script: "node_modules/next/dist/bin/next",
            args: "start -- --port 3003",
            exec_mode: "cluster",
            max_memory_restart: "256M"
        },
        {
            name: "spade-landing-register-02",
            cwd: "./landing-register-02",
            script: "node_modules/next/dist/bin/next",
            args: "start -- --port 3004",
            exec_mode: "cluster",
            max_memory_restart: "256M"
        },
    ]
}