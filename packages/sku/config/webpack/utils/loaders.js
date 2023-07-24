/**
 * e.g.
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
    browserslist,
    generateCSSTypes = false,
    packageName,
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
    ...(target === 'browser' ? [MiniCssExtractPlugin.loader] : []),
    ...cssModuleToTypeScriptLoader,
    {
      loader: require.resolve('css-loader'),
      options: {
        modules: {
          // On the server, avoid generating a CSS file with onlyLocals.
          // Only the client build should generate CSS files.
          exportOnlyLocals: target === 'node',
          mode: 'local',
          localIdentName: `${debugIdent}[hash:base64:7]`,
        },

        importLoaders: 3,
      },
    },
    ...(target === 'browser'
      ? [
          {
            loader: require.resolve('postcss-loader'),
            options: {
              postcssOptions: {
                plugins: [
                  require('autoprefixer')({
                    overrideBrowserslist: browserslist,
                  }),
                  // Minimize CSS on production builds
                  ...(isProductionBuild
                    ? [
                        require('cssnano')({
                          preset: [
                            'default',
                            {
                              calc: false,
                            },
                          ],
                        }),
                      ]
                    : []),
                ],
              },
            },
          },
        ]
      : []),
    {
      loader: require.resolve('less-loader'),
    },
  ];
};

const makeExternalCssLoaders = (options = {}) => {
  const { target, isProductionBuild, MiniCssExtractPlugin, browserslist } =
    options;

  return [
    ...(!target || target === 'browser' ? [MiniCssExtractPlugin.loader] : []),
    {
      loader: require.resolve('css-loader'),
      options: {
        url: false,
      },
    },
    {
      loader: require.resolve('postcss-loader'),
      options: {
        postcssOptions: {
          plugins: [
            require('autoprefixer')({ overrideBrowserslist: browserslist }),
            // Minimize CSS on production builds
            ...(isProductionBuild
              ? [
                  require('cssnano')({
                    preset: [
                      'default',
                      {
                        calc: false,
                      },
                    ],
                  }),
                ]
              : []),
          ],
        },
      },
    },
  ];
};

const makeSvgLoaders = () => [
  {
    loader: require.resolve('svgo-loader'),
    options: {
      plugins: [
        {
          name: 'preset-default',
          params: {
            overrides: {
              removeViewBox: false,
            },
          },
        },
        {
          name: 'addAttributesToSVGElement',
          params: {
            attributes: [{ focusable: false }],
          },
        },
      ],
    },
  },
];

module.exports = {
  makeJsLoaders,
  makeCssLoaders,
  makeExternalCssLoaders,
  makeSvgLoaders,
};
