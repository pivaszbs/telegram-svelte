const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const { preprocess } = require('./svelte.config');
const merge = require('webpack-merge');

const common = {
	entry: {
		index: path.join(__dirname, 'src') + '/main.js',
	},
	resolve: {
		alias: {
			Source: path.resolve(__dirname, 'src'),
			svelte: path.resolve('node_modules', 'svelte'),
			images: path.resolve(__dirname, 'src/assets/images')
		},
		extensions: ['.mjs', '.js', '.json', '.svelte', '.html'],
	},
	output: {
		filename: '[name].bundle.js',
		path: path.join(__dirname, 'build'),
	},
	optimization: {
		runtimeChunk: 'single',
		splitChunks: {
			chunks: 'all',
		},
	},
	module: {
		rules: [
			// {
			// 	test: /\.scss$/,
			// 	use: ['style-loader', 'css-loader', 'sass-loader'],
			// },
			{
				test: /\.(sa|sc|c)ss$/,
				use: [
					'style-loader',
					MiniCssExtractPlugin.loader,
					'css-loader',
					{
						loader: 'sass-loader',
						options: {
							sassOptions: {
								includePaths: ['./src/theme', './node_modules'],
							},
						},
					},
				],
			},
			{
				test: /\.(png|jpe?g|gif)(\?v=\d+\.\d+\.\d+)?$/,
				use: [
					{
						loader: 'file-loader',
						options: {
							name: '[name].[ext]',
							outputPath: 'images/',
						},
					},
				],
			},
			{
				test: /\.(woff(2)?|ttf|eot|otf)(\?v=\d+\.\d+\.\d+)?$/,
				use: [
					{
						loader: 'file-loader',
						options: {
							name: '[name].[ext]',
							outputPath: 'fonts/',
						},
					},
				],
			},
			{
				test: /\.(svg)(\?v=\d+\.\d+\.\d+)?$/,
				use: [
					{
						loader: 'file-loader',
						options: {
							name: '[name].[ext]',
							outputPath: 'icons/',
						},
					},
				],
			},
			{
				test: /\.m?js$/,
				exclude: /(node_modules|bower_components)/,
				use: {
					loader: 'babel-loader',
				},
			},
			{
				test: /\.(svelte)$/,
				exclude: /(node_modules|public)/,
				use: {
					loader: 'svelte-loader',
					options: {
						emitCss: true,
						css: false,
						preprocess,
						hotReload: true,
					},
				},
			},
			{
				test: /\.(tsx?)$/,
				exclude: /(node_modules|public)/,
				use: {
					loader: 'ts-loader',
				},
			},
		],
	},
	plugins: [
		new HtmlWebpackPlugin({
			filename: 'index.html',
			template: path.join(__dirname, '/public/index.html'),
			inject: true,
		}),
		new MiniCssExtractPlugin({
			filename: '[name].css',
			chunkFilename: '[name].[id].css',
		}),
		new OptimizeCssAssetsPlugin({
			assetNameRegExp: /\.css$/g,
			cssProcessor: require('cssnano'),
			cssProcessorPluginOptions: {
				preset: ['default', { discardComments: { removeAll: true } }],
			},
			canPrint: true,
		}),
	],
};

const devServer = {
	devServer: {
		stats: 'errors-only',
	},
};

module.exports = env => {
	if (env === 'production') {
		return common;
	}
	if (env === 'development') {
		return merge([common, devServer]);
	}
};
