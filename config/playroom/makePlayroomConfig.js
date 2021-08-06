const { red, yellow, bold } = require('chalk');
const omitBy = require('lodash/omitBy');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const { paths, playroom, rootResolution } = require('../../context');
const SkuWebpackPlugin = require('../webpack/plugins/sku-webpack-plugin');

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

module.exports = () =>
  omitBy(
    {
      port: playroom.port,
      title: playroom.title,
      outputPath: paths.playroomTarget,
      components: paths.playroomComponents,
      themes: paths.playroomThemes,
      snippets: paths.playroomSnippets,
      frameComponent: paths.playroomFrameComponent,
      scope: paths.playroomScope,
      openBrowser: process.env.OPEN_TAB !== 'false',
      ...playroom,
      webpackConfig: () => ({
        plugins: [
          new SkuWebpackPlugin({
            include: paths.src,
            compilePackages: paths.compilePackages,
            target: 'browser',
            hot: false,
            generateCSSTypes: false,
            browserslist: 'last 2 chrome versions',
            mode: 'development',
            displayNamesProd: true,
            removeAssertionsInProduction: false,
            MiniCssExtractPlugin,
            rootResolution,
          }),
        ],
        optimization: {
          concatenateModules: false,
        },
      }),
    },
    (v) => typeof v === 'undefined' || v === null,
  );
