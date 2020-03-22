/**
 * e.g.
 * seek-style-guide -> __SEEK_STYLE_GUIDE__
 * @foo/awesome -> __FOO_AWESOME__
 */
const packageNameToClassPrefix = (packageName) =>
  `__${packageName.toUpperCase().replace(/[\/\-]/g, '_')}__`;

const makeJsLoaders = (options) => [
  {
    loader: require.resolve('babel-loader'),
    options: require('../../babel/babelConfig')(options),
  },
];

const makeCssLoaders = (options = {}) => {
  const {
    target,
    isCI,
    isProductionBuild,
    MiniCssExtractPlugin,
    supportedBrowsers,
    generateCSSTypes = false,
    packageName,
    hot = false,
    compilePackage = false,
  } = options;

  const debugIdent = isProductionBuild
    ? ''
    : `${
        packageName ? packageNameToClassPrefix(packageName) : ''
      }[name]__[local]___`;

  // Apply css-modules-typescript-loader for client builds only as
  // we only need to generate type declarations once.
  // Also, ignore compile packages as the types can't be committed
  const cssModuleToTypeScriptLoader =
    generateCSSTypes && target === 'browser' && !compilePackage
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
    ...(target === 'browser'
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
        onlyLocals: target === 'node',
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
  ];
};

const makeCssInJsLoaders = (loaderOptions = {}) => {
  const cssInJsLoaders = [
    { loader: require.resolve('./cssInJsLoader') },
    ...makeJsLoaders(loaderOptions),
  ];

  return [...makeCssLoaders(loaderOptions), ...cssInJsLoaders];
};

const makeImageLoaders = (options = {}) => {
  const { target = 'browser' } = options;

  return [
    {
      loader: require.resolve('url-loader'),
      options: {
        limit: 10000,
        fallback: require.resolve('file-loader'),
        // We only want to emit client assets during the client build.
        // The server build should only emit server-side JS and HTML files.
        emitFile: target === 'browser',
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
  makeCssInJsLoaders,
  makeImageLoaders,
  makeSvgLoaders,
};
