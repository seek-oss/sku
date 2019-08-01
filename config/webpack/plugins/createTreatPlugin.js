const TreatPlugin = require('treat/webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { supportedBrowsers } = require('../../../context');

const braidThemes = ['wireframe', 'jobStreet', 'seekAnz', 'seekAsia'];

module.exports = ({ target, isProductionBuild, internalJs }) => {
  const localIdentName = `${
    isProductionBuild ? '' : 'BRAID__[name]-[local]_'
  }[hash:base64:5]`;

  const themeIdentFallback = '[hash:base64:3]';

  const devThemeIdent = theme =>
    theme.name ? `_${theme.name}` : themeIdentFallback;

  const prodThemeIdent = theme => {
    const braidThemeIndex = braidThemes.indexOf(theme.name);

    if (braidThemeIndex >= 0) {
      return `${braidThemeIndex}`;
    }

    return themeIdentFallback;
  };

  const themeIdentName = isProductionBuild ? prodThemeIdent : devThemeIdent;

  return new TreatPlugin({
    test: {
      test: /\.treat\.ts$/,
      include: internalJs,
    },
    outputCSS: target === 'browser',
    outputLoaders: [MiniCssExtractPlugin.loader],
    localIdentName,
    themeIdentName,
    browsers: supportedBrowsers,
  });
};
