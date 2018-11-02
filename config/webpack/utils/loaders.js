const supportedBrowsers = require('../../browsers/supportedBrowsers');
const { isProductionBuild, isCI } = require('./env');
const isTypeScript = require('../../../lib/isTypeScript');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

/**
 * e.g.
 * seek-style-guide -> __SEEK_STYLE_GUIDE__
 * @foo/awesome -> __FOO_AWESOME__
 */
const packageNameToClassPrefix = packageName =>
  `__${packageName.toUpperCase().replace(/[\/\-]/g, '_')}__`;

const makeJsLoaders = ({ target, lang }) => [
  {
    loader: require.resolve('babel-loader'),
    options: require('../../babel/babelConfig')({ target, lang })
  }
];

const makeCssLoaders = (options = {}) => {
  const { server = false, packageName = '', js = false, hot = false } = options;

  const debugIdent = isProductionBuild
    ? ''
    : `${
        packageName ? packageNameToClassPrefix(packageName) : ''
      }[name]__[local]___`;

  const cssInJsLoaders = [
    { loader: require.resolve('css-in-js-loader') },
    ...makeJsLoaders({ target: 'node' })
  ];

  // Apply css-modules-typescript-loader for client builds only as
  // we only need to generate type declarations once.
  const cssModuleToTypeScriptLoader =
    isTypeScript() && !server
      ? [
          {
            loader: require.resolve('css-modules-typescript-loader'),
            options: {
              mode: isCI ? 'verify' : 'emit'
            }
          }
        ]
      : [];

  return [
    ...(hot ? ['css-hot-loader'] : []),
    ...(!server ? [MiniCssExtractPlugin.loader] : []),
    ...cssModuleToTypeScriptLoader,
    {
      // On the server, we use 'css-loader/locals' to avoid generating a CSS file.
      // Only the client build should generate CSS files.
      loader: require.resolve(`css-loader${server ? '/locals' : ''}`),
      options: {
        modules: true,
        localIdentName: `${debugIdent}[hash:base64:7]`,
        minimize: isProductionBuild,
        importLoaders: 3
      }
    },
    {
      loader: require.resolve('postcss-loader'),
      options: {
        plugins: () => [require('autoprefixer')(supportedBrowsers)]
      }
    },
    {
      loader: require.resolve('less-loader')
    },
    {
      // Hacky fix for https://github.com/webpack-contrib/css-loader/issues/74
      loader: require.resolve('string-replace-loader'),
      options: {
        search: '(url\\([\'"]?)(.)',
        replace: '$1\\$2',
        flags: 'g'
      }
    },
    ...(js ? cssInJsLoaders : [])
  ];
};

const makeImageLoaders = (options = {}) => {
  const { server = false } = options;

  return [
    {
      loader: require.resolve('url-loader'),
      options: {
        limit: 10000,
        fallback: require.resolve('file-loader'),
        // We only want to emit client assets during the client build.
        // The server build should only emit server-side JS and HTML files.
        emitFile: !server
      }
    }
  ];
};

const makeSvgLoaders = () => [
  {
    loader: require.resolve('raw-loader')
  },
  {
    loader: require.resolve('svgo-loader'),
    options: {
      plugins: [
        {
          addAttributesToSVGElement: {
            attribute: 'focusable="false"'
          }
        },
        {
          removeViewBox: false
        }
      ]
    }
  }
];

module.exports = {
  makeJsLoaders,
  makeCssLoaders,
  makeImageLoaders,
  makeSvgLoaders
};
