const path = require('path');
const webpack = require('webpack');
require('dotenv').config({ path: '.env.local', quiet: true });
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { preprocess } = require('./svelte.config');

module.exports = (env = {}, argv) => ({
	entry: './src/main.js',
	output: {
		path: path.resolve(__dirname, 'build'),
		filename: '[name].[contenthash].js',
		clean: true,
	},
	devtool: argv.mode === 'development' ? 'eval-source-map' : 'source-map',
	resolve: {
		alias: {
			Source: path.resolve(__dirname, 'src'),
			images: path.resolve(__dirname, 'src/assets/images'),
			inline: path.resolve(__dirname, 'src/assets/inline'),
		},
		extensions: ['.mjs', '.js', '.json', '.svelte'],
		conditionNames: ['svelte', 'browser', '...'],
	},
	module: {
		rules: [
			// SMUI publishes extensionless ESM imports. Limit the workaround to SMUI.
			{
				test: /\.m?js$/,
				include: /node_modules[\\/]@smui[\\/]/,
				resolve: { fullySpecified: false },
			},
			{
				test: /\.svelte$/,
				use: {
					loader: 'svelte-loader',
					options: {
						preprocess,
						emitCss: true,
						compilerOptions: { dev: argv.mode === 'development' },
					},
				},
			},
			{
				test: /\.(scss|css)$/,
				use: [
					MiniCssExtractPlugin.loader,
					'css-loader',
					{
						loader: 'sass-loader',
						options: {
							sassOptions: {
								loadPaths: [
									path.resolve(__dirname, 'src/theme'),
									path.resolve(__dirname, 'node_modules'),
								],
							},
						},
					},
				],
			},
			{
				test: /\.svg$/,
				include: path.resolve(__dirname, 'src/assets/inline'),
				type: 'asset/source',
			},
			{
				test: /\.(png|jpe?g|gif|svg|woff2?|ttf|eot|otf)$/,
				exclude: path.resolve(__dirname, 'src/assets/inline'),
				type: 'asset/resource',
			},
		],
	},
	plugins: [
        new webpack.DefinePlugin({
            __UI_PREVIEW__: JSON.stringify(Boolean(env.preview)),
            __TELEGRAM_API_ID__: JSON.stringify(env.preview ? '123456' : process.env.TELEGRAM_API_ID || ''),
            __TELEGRAM_API_HASH__: JSON.stringify(env.preview ? '0123456789abcdef0123456789abcdef' : process.env.TELEGRAM_API_HASH || ''),
        }),
		new HtmlWebpackPlugin({
			template: './public/index.html',
			favicon: './public/favicon.png',
		}),
		new MiniCssExtractPlugin({ filename: '[name].[contenthash].css' }),
	],
	devServer: {
		host: '127.0.0.1',
		port: 5173,
		historyApiFallback: true,
		static: './public',
		// Keep existing warnings in the console without covering the app.
		client: { overlay: { errors: true, warnings: false } },
	},
});
