module.exports = {
  apps: [
    {
      name: 'reeyo-rider-api',
      script: './dist/server.js',
      instances: 'max',
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3003,
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3003,
      },
      env_staging: {
        NODE_ENV: 'staging',
        PORT: 3003,
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_file: './logs/pm2-combined.log',
      time: true,
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
    },
  ],
};
