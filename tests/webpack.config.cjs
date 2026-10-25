const path = require('path');
const webpack = require('webpack');
const createConfig = require('../webpack.config');
const config = createConfig({ preview: true }, { mode: 'development' });
config.entry = ['./src/main.js', './tests/fixtures/transport-smoke.js'];
config.resolve.alias['real-auth-transport'] = path.resolve(__dirname, '../src/services/auth/telegram-transport.js');
config.plugins.push(new webpack.NormalModuleReplacementPlugin(
  /telegram-transport\.js$/,
  path.resolve(__dirname, 'fixtures/auth-transport.js'),
));
config.devServer.port = 5174;
module.exports = config;
