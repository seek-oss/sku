const makeJsLoaders = (options) => [
  {
    loader: require.resolve('babel-loader'),
    options: require('../../babel/babelConfig')(options),
  },
];

const { cwd } = require('../../../lib/cwd');

const makeExperimentalSwcJsLoaders = (options) => [
  {
    loader: require.resolve('swc-loader'),
    options: {
      minify: false,
      sourceMaps: true,
      jsc: {
        parser: {
          jsx: true,
          syntax: 'typescript',
          tsx: true,
        },
        transform: {
          react: {
            development: process.env.NODE_ENV !== 'production',
            refresh: options.hot && options.target === 'browser',
            runtime: 'automatic',
          },
        },
        target: 'es2020',
        // Try changing to true and installing @swc/helpers
        externalHelpers: true,
        ...(options.rootResolution
          ? {
              baseUrl: cwd(),
            }
          : {}),
        experimental: {
          cacheRoot: 'node_modules/.cache/swc',
          plugins: [
            [
              require.resolve('@swc/plugin-loadable-components'),
              {
                signatures: [
                  {
                    name: 'default',
                    from: 'sku/@loadable/component',
                  },
                  {
                    name: 'loadableReady',
                    from: 'sku/@loadable/component',
                  },
                ],
              },
            ],
          ],
        },
      },
    },
  },
];

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
  makeExperimentalSwcJsLoaders,
  makeExternalCssLoaders,
  makeSvgLoaders,
};
