const TreatPlugin = require('treat/plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = ({ target, isProductionBuild }) => {
  const localIdentName = `${
    isProductionBuild ? '' : 'BRAID__[name]-[local]_'
  }[hash:base64:5]`;

  const themeIdentName = `${
    isProductionBuild ? '' : '-[folder]_'
  }[hash:base64:3]`;

  return new TreatPlugin({
    test: /braid-design-system\/(?!node_modules).+\.treat\.(?:js|ts)/,
    outputCSS: target === 'browser',
    outputLoaders: [MiniCssExtractPlugin.loader],
    localIdentName,
    themeIdentName,
  });
};
