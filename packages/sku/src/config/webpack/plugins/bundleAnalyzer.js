// @ts-check
import { getPathFromCwd } from '../../../lib/cwd.js';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';

export const bundleReportFolder = 'report';

/**
 * @param {object} options
 * @param {string} options.name Name of the report file. E.g. `client` will result in `client.html`.
 */
export const bundleAnalyzerPlugin = ({ name }) =>
  new BundleAnalyzerPlugin({
    analyzerMode: 'static',
    openAnalyzer: false,
    reportFilename: getPathFromCwd(`${bundleReportFolder}/${name}.html`),
  });
