const WebpackDevServer = require('webpack-dev-server');
const webpack = require('webpack');
const webpackConfig = require('../config/webpack/webpack.config');
const builds = require('../config/builds');
const find = require('lodash/find');
const opn = require('opn');

const compiler = webpack(webpackConfig);
const devServer = new WebpackDevServer(compiler, {
  contentBase: builds.map(({ paths }) => paths.public)
});

const port = 8080;
devServer.listen(port, (err, result) => {
  if (err) {
    return console.log(err);
  }

  console.log(`Starting the development server on port ${port}...`);
  console.log();

  opn(`http://localhost:${port}`);
});
