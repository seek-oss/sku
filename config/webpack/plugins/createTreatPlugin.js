const TreatPlugin = require('treat/plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = ({ target, isStartScript }) => {
  const localIdentName = isStartScript
    ? 'BRAID__[name]-[local]_[hash:base64:5]'
    : '[hash:base64:5]';

  const themeIdentName = isStartScript
    ? '-[folder]_[hash:base64:3]'
    : '[hash:base64:3]';

  return new TreatPlugin({
    test: /braid-design-system\/(?!node_modules).+\.treat\.(?:js|ts)/,
    outputCSS: target === 'browser',
    outputLoaders: [MiniCssExtractPlugin.loader],
    localIdentName,
    themeIdentName,
  });
};
