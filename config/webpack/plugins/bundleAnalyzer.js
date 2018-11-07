const path = require('path');
const { cwd } = require('../../../lib/cwd');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

const bundleReportFolder = 'report';

const bundleAnalyzerPlugin = ({ name }) =>
  new BundleAnalyzerPlugin({
    analyzerMode: 'static',
    openAnalyzer: false,
    reportFilename: path.join(cwd(), `${bundleReportFolder}/${name}.html`)
  });

module.exports = {
  bundleAnalyzerPlugin,
  bundleReportFolder
};
