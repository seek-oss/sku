const isProductionBuild = process.env.NODE_ENV === 'production';

const getDebugIdent = styleGuide => {
  return isProductionBuild
    ? ''
    : `${styleGuide ? '__STYLE_GUIDE__' : ''}[name]__[local]___`;
};

const cssLoader = (debugIdent, server) => {
  return {
    loader: require.resolve(`css-loader${server ? '/locals' : ''}`),
    options: {
      modules: true,
      localIdentName: `${debugIdent}[hash:base64:7]`,
      minimize: isProductionBuild,
      importLoaders: 3
    }
  };
};

const autoprefixer = require('autoprefixer')({
  browsers: ['> 1%', 'Last 2 versions', 'ie >= 10', 'Safari >= 8', 'iOS >= 8']
});

const stringReplaceLoader = {
  // Hacky fix for https://github.com/webpack-contrib/css-loader/issues/74
  loader: require.resolve('string-replace-loader'),
  options: {
    search: '(url\\([\'"]?)(\.)',
    replace: '$1\\$2',
    flags: 'g'
  }
};

const makePostCssLoaders = (options = {}) => {
  const {
    server = false,
    styleGuide = false,
    theme = null
  } = options;

  const debugIdent = getDebugIdent(styleGuide);
  return [
    cssLoader(debugIdent, server),
    {
      loader: require.resolve('postcss-loader'),
      options: {
        plugins: () => [
          autoprefixer,
          require('postcss-import')({ path: [theme] }),
          require('postcss-cssnext')
        ]
      }
    },
    stringReplaceLoader
  ];
};

const makeLessCssLoaders = (options = {}) => {
  const {
    server = false,
    styleGuide = false
  } = options;

  const debugIdent = getDebugIdent(styleGuide);
  return [
    cssLoader(debugIdent, server),
    {
      loader: require.resolve('postcss-loader'),
      options: {
        plugins: () => [autoprefixer]
      }
    },
    {
      loader: require.resolve('less-loader')
    },
    stringReplaceLoader
  ];
};

module.exports = {
  makePostCssLoaders,
  makeLessCssLoaders
};
