const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

const bundleReportFolder = 'report';

const bundleAnalyzerPlugin = ({ name }) =>
  new BundleAnalyzerPlugin({
    analyzerMode: 'static',
    openAnalyzer: false,
    reportFilename: `../${bundleReportFolder}/${name}.html`
  });

module.exports = {
  bundleAnalyzerPlugin,
  bundleReportFolder
};
