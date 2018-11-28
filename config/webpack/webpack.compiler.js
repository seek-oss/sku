const webpack = require('webpack');

const { isLibrary, isStartScript } = require('../../context');

const htmlRenderPlugin = require('./plugins/htmlRenderPlugin');
const webpackConfig = require('./webpack.config');

const compiler = webpack(webpackConfig);

// Don't render HTML when building a library
if (!isLibrary || isStartScript) {
  compiler.apply(htmlRenderPlugin());
}

module.exports = compiler;
