const path = require('path');

const deployPath = process.env.DEPLOY_PATH || '/home/ubuntu/app';

module.exports = {
  apps: [
    {
      name: 'placement-backend',
      cwd: path.join(deployPath, 'backend'),
      script: 'dist/server.js',
      instances: 1,
      autorestart: true,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      }
    }
  ]
};
