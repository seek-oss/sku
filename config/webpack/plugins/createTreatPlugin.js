const TreatPlugin = require('treat/webpack-plugin');

const braidThemes = [
  'apac',
  'jobStreet',
  'jobStreetClassic',
  'jobsDb',
  'seekAnz',
  'seekBusiness',
  'seekUnifiedBeta',
  'occ',
  'catho',
  'docs',
  'wireframe',
];

module.exports = ({
  target,
  isProductionBuild,
  include,
  libraryName,
  supportedBrowsers,
  MiniCssExtractPlugin,
  hot,
}) => {
  const libraryPrefix = libraryName ? `${libraryName}_` : '';

  const localIdentName = `${libraryPrefix}${
    isProductionBuild ? '' : 'BRAID__[name]-[local]_'
  }[hash:base64:5]`;

  const themeIdentFallback = '[hash:base64:3]';

  const devThemeIdent = (theme) =>
    theme.name ? `_${theme.name}` : themeIdentFallback;

  const prodThemeIdent = (theme) => {
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
      include,
    },
    outputCSS: target === 'browser',
    outputLoaders: [
      {
        loader: MiniCssExtractPlugin.loader,
        options: {
          hmr: hot,
          reloadAll: true,
        },
      },
    ],
    localIdentName,
    themeIdentName,
    browsers: supportedBrowsers,
    hmr: hot,
  });
};
