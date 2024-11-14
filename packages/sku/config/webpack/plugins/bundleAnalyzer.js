// @ts-check
const { getPathFromCwd } = require('../../../lib/cwd');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

const bundleReportFolder = 'report';

/**
 * @param {object} options
 * @param {string} options.name Name of the report file. E.g. `client` will result in `client.html`.
 */
const bundleAnalyzerPlugin = ({ name }) =>
  new BundleAnalyzerPlugin({
    analyzerMode: 'static',
    openAnalyzer: false,
    reportFilename: getPathFromCwd(`${bundleReportFolder}/${name}.html`),
  });

module.exports = {
  bundleAnalyzerPlugin,
  bundleReportFolder,
};
