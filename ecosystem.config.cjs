module.exports = {
  apps: [
    {
      name: 'gamevault',
      script: 'node_modules/.bin/tsx',
      args: 'server.ts',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    }
  ]
};
