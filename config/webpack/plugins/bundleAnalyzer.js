const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

module.exports = ({ name }) =>
  new BundleAnalyzerPlugin({
    analyzerMode: 'static',
    openAnalyzer: false,
    reportFilename: `report/${name}.html`
  });
