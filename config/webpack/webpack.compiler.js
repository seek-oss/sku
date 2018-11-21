const webpack = require('webpack');

const htmlRenderPlugin = require('./plugins/htmlRenderPlugin');
const webpackConfig = require('./webpack.config');

const compiler = webpack(webpackConfig);
compiler.apply(htmlRenderPlugin());

module.exports = compiler;
