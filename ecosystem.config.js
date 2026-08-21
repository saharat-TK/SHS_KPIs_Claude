module.exports = {
  apps: [
    {
      name: "SHSKPIs",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3005",
      cwd: "C:\\inetpub\\wwwroot\\SHS_KPIs_Claude",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 3005,
      },
    },
  ],
};
