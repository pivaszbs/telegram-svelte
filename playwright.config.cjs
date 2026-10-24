const { defineConfig } = require('@playwright/test');
module.exports = defineConfig({
  testDir: './tests/browser',
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL: 'http://127.0.0.1:5174', viewport: { width: 1280, height: 800 }, video: 'on', screenshot: 'only-on-failure', trace: 'retain-on-failure' },
  webServer: {
    command: 'webpack serve --config tests/webpack.config.cjs --mode development',
    url: 'http://127.0.0.1:5174',
    reuseExistingServer: !process.env.CI,
  },
});
