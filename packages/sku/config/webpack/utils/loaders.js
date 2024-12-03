import { fileURLToPath } from 'node:url';
import babelConfig from '../../babel/babelConfig.js';
import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano';

export const makeJsLoaders = (options) => [
  {
    loader: fileURLToPath(import.meta.resolve('babel-loader')),
    options: babelConfig(options),
  },
];

export const makeExternalCssLoaders = (options = {}) => {
  const { target, isProductionBuild, MiniCssExtractPlugin, browserslist } =
    options;

  return [
    ...(!target || target === 'browser' ? [MiniCssExtractPlugin.loader] : []),
    {
      loader: fileURLToPath(import.meta.resolve('css-loader')),
      options: {
        url: false,
      },
    },
    {
      loader: fileURLToPath(import.meta.resolve('postcss-loader')),
      options: {
        postcssOptions: {
          plugins: [
            autoprefixer({ overrideBrowserslist: browserslist }),
            // Minimize CSS on production builds
            ...(isProductionBuild
              ? [
                  cssnano({
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

export const makeSvgLoaders = () => [
  {
    loader: fileURLToPath(import.meta.resolve('svgo-loader')),
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
