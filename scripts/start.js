const WebpackDevServer = require('webpack-dev-server');
const webpack = require('webpack');
const webpackConfig = require('../config/webpack/webpack.config');
const path = require('path');

const dist = path.join(process.cwd(), 'dist');

const compiler = webpack(webpackConfig);
const devServer = new WebpackDevServer(compiler, {
  contentBase: dist
});

const port = 8080;
devServer.listen(port, (err, result) => {
  if (err) {
    return console.log(err);
  }

  console.log(`Starting the development server on port ${port}...`);
  console.log();
});
