const path = require('path');
const webpack = require('webpack');
const createConfig = require('../webpack.config');
const config = createConfig({}, { mode: 'development' });
config.plugins.push(new webpack.NormalModuleReplacementPlugin(
  /(?:^|\/)TelegramApi(?:\/index(?:\.js)?)?$/,
  path.resolve(__dirname, 'fixtures/telegram-api.js'),
));
config.devServer.port = 5174;
module.exports = config;
