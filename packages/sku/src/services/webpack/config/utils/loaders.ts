import babelConfig from '../../babel/babelConfig.js';
import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano';
import { createRequire } from 'node:module';

type BabelConfigOptions = {
  target: 'node' | 'browser';
  lang: 'js' | 'ts';
  browserslist?: string[];
  displayNamesProd?: boolean;
  removeAssertionsInProduction?: boolean;
  hot?: boolean;
  rootResolution?: boolean;
};

const require = createRequire(import.meta.url);

export const makeJsLoaders = (options: BabelConfigOptions) => [
  {
    loader: require.resolve('babel-loader'),
    options: babelConfig(options),
  },
];

type MakeExternalCssLoadersOptions = {
  target: 'node' | 'browser';
  isProductionBuild: boolean;
  MiniCssExtractPlugin: any;
  browserslist?: string[];
  hot?: boolean;
};

export const makeExternalCssLoaders = (
  options: MakeExternalCssLoadersOptions,
) => {
  const { target, isProductionBuild, MiniCssExtractPlugin, browserslist } =
    options || {};

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
