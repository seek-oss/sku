const { red, yellow, bold } = require('chalk');
const find = require('lodash/find');
const { paths, playroom } = require('../../context');
const makeWebpackConfig = require('../webpack/webpack.config');

const clientWebpackConfig = find(
  makeWebpackConfig({ isIntegration: true }),
  config => config.name === 'client',
);

try {
  require.resolve(paths.playroomComponents);
} catch (e) {
  console.log(
    red(`No playroom components file located at ${paths.playroomComponents}.`),
  );
  console.log(
    yellow(
      `Change this location by setting the '${bold(
        'playroomComponents',
      )}' option in your sku config.`,
    ),
  );
  process.exit(1);
}

module.exports = () => ({
  port: playroom.port,
  title: playroom.title,
  outputPath: paths.playroomTarget,
  components: paths.playroomComponents,
  themes: paths.playroomThemes,
  frameComponent: paths.playroomFrameComponent,
  openBrowser: process.env.OPEN_TAB !== 'false',
  ...playroom,
  webpackConfig: () => ({
    module: clientWebpackConfig.module,
    resolve: clientWebpackConfig.resolve,
    plugins: clientWebpackConfig.plugins,
  }),
});
