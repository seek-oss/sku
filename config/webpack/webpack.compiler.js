const webpack = require('webpack');
const webpackConfig = require('./webpack.config');

const compiler = webpack(webpackConfig);

module.exports = compiler;
