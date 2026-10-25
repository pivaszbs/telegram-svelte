// Use the real application bundle with blank credentials. Never contact Telegram.
const webpack = require('webpack');
const createConfig = require('../webpack.config');
const config = createConfig({}, { mode: 'development' });
const defines = config.plugins.find(plugin => plugin instanceof webpack.DefinePlugin).definitions;
defines.__TELEGRAM_API_ID__ = JSON.stringify('');
defines.__TELEGRAM_API_HASH__ = JSON.stringify('');
config.plugins.push(new webpack.NormalModuleReplacementPlugin(/telegram-transport\.js$/, require('path').resolve(__dirname, 'fixtures/auth-transport.js')));
config.devServer.port = 5175;
module.exports = config;
