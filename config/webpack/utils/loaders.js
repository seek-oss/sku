const supportedBrowsers = require('../../browsers/supportedBrowsers');
const { isProductionBuild } = require('./env');

/**
 * e.g.
 * seek-style-guide -> __SEEK_STYLE_GUIDE__
 * @foo/awesome -> __FOO_AWESOME__
 */
const packageNameToClassPrefix = packageName =>
  `__${packageName.toUpperCase().replace(/[\/\-]/g, '_')}__`;

const makeJsLoaders = ({ target }) => [
  {
    loader: require.resolve('babel-loader'),
    options: require('../../babel/babelConfig')({ target })
  }
];

const makeCssLoaders = (options = {}) => {
  const { server = false, packageName = '', js = false } = options;

  const debugIdent = isProductionBuild
    ? ''
    : `${
        packageName ? packageNameToClassPrefix(packageName) : ''
      }[name]__[local]___`;

  const cssInJsLoaders = [
    { loader: require.resolve('css-in-js-loader') },
    ...makeJsLoaders({ target: 'node' })
  ];

  return [
    {
      // On the server, we use 'css-loader/locals' to avoid generating a CSS file.
      // Only the client build should generate CSS files.
      loader: require.resolve(
        server ? 'css-loader/locals' : 'typings-for-css-modules-loader'
      ),
      options: {
        modules: true,
        namedExport: true,
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
