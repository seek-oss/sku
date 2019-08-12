const { supportedBrowsers, paths } = require('../../../context');
const { isProductionBuild, isCI } = require('./env');
const isTypeScript = require('../../../lib/isTypeScript');
const { resolvePackage } = require('./resolvePackage');
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
    options: require('../../babel/babelConfig')({ target, lang }),
  },
];

const makeCssLoaders = (options = {}) => {
  const {
    server = false,
    packageName = '',
    js = false,
    hot = false,
    compilePackage = false,
  } = options;

  const debugIdent = isProductionBuild
    ? ''
    : `${
        packageName ? packageNameToClassPrefix(packageName) : ''
      }[name]__[local]___`;

  const cssInJsLoaders = [
    { loader: require.resolve('./cssInJsLoader') },
    ...makeJsLoaders({ target: 'node' }),
  ];

  // Apply css-modules-typescript-loader for client builds only as
  // we only need to generate type declarations once.
  // Also, ignore compile packages as the types can't be committed
  const cssModuleToTypeScriptLoader =
    isTypeScript && !server && !compilePackage
      ? [
          {
            loader: require.resolve('css-modules-typescript-loader'),
            options: {
              mode: isCI ? 'verify' : 'emit',
            },
          },
        ]
      : [];

  return [
    ...(!server
      ? [
          {
            loader: MiniCssExtractPlugin.loader,
            options: {
              hmr: hot,
            },
          },
        ]
      : []),
    ...cssModuleToTypeScriptLoader,
    {
      loader: require.resolve('css-loader'),
      options: {
        modules: {
          mode: 'local',
          localIdentName: `${debugIdent}[hash:base64:7]`,
        },

        // On the server, avoid generating a CSS file with onlyLocals.
        // Only the client build should generate CSS files.
        onlyLocals: Boolean(server),
        importLoaders: 3,
      },
    },
    {
      loader: require.resolve('postcss-loader'),
      options: {
        plugins: () => [
          require('autoprefixer')(supportedBrowsers),
          // Minimize CSS on production builds
          ...(isProductionBuild ? [require('cssnano')()] : []),
        ],
      },
    },
    {
      loader: require.resolve('less-loader'),
    },
    ...(js ? cssInJsLoaders : []),
  ];
};

const makeCssOneOf = (loaderOptions = {}) => [
  ...paths.compilePackages.map(packageName => ({
    include: resolvePackage(packageName),
    use: makeCssLoaders({
      packageName,
      compilePackage: true,
      ...loaderOptions,
    }),
  })),
  {
    exclude: /node_modules/,
    use: makeCssLoaders(loaderOptions),
  },
];

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
        emitFile: !server,
      },
    },
  ];
};

const makeSvgLoaders = () => [
  {
    loader: require.resolve('raw-loader'),
  },
  {
    loader: require.resolve('svgo-loader'),
    options: {
      plugins: [
        {
          addAttributesToSVGElement: {
            attribute: 'focusable="false"',
          },
        },
        {
          removeViewBox: false,
        },
      ],
    },
  },
];

module.exports = {
  makeJsLoaders,
  makeCssLoaders,
  makeImageLoaders,
  makeSvgLoaders,
  makeCssOneOf,
};
