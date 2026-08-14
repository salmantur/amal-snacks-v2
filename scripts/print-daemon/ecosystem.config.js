// pm2 process definition for the kitchen print daemon.
// Usage (from the repo root, on the kitchen device):
//   pm2 start scripts/print-daemon/ecosystem.config.js
//   pm2 save
//   pm2 startup   # then run the command it prints, to survive reboots
const path = require("path")

module.exports = {
  apps: [
    {
      name: "amal-print-daemon",
      script: "./node_modules/.bin/tsx",
      args: "scripts/print-daemon/index.ts",
      cwd: path.join(__dirname, "..", ".."),
      autorestart: true,
      restart_delay: 5000,
      max_restarts: 50,
      env: {
        NODE_ENV: "production",
      },
    },
  ],
}
