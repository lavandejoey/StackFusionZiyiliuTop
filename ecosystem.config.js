module.exports = {
  apps: [
    {
      name: "api",
      script: "npm",
      args: "start",
      cwd: "./backend",
      watch: false,
      env_production: {
        NODE_ENV: "production",
        PORT: 2069
      }
    },
    {
      name: "frontend",
      script: "npm",
      args: "run preview",
      cwd: "./frontend",
      watch: false,
      env_production: {
        NODE_ENV: "production",
        PORT: 35835
      }
    }
  ]
}
