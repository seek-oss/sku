const makeJsLoaders = (options) => [
  {
    loader: require.resolve('babel-loader'),
    options: require('../../babel/babelConfig')(options),
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
  makeExternalCssLoaders,
  makeSvgLoaders,
};
