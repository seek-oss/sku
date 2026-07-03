import babelConfig from '../../../../config/babel.js';
import { createRequire } from 'node:module';
import lightningcssPlugin from 'postcss-lightningcss';

type BabelConfigOptions = {
  target: 'node' | 'browser';
  lang: 'js' | 'ts';
  browserslist?: string[];
  displayNamesProd?: boolean;
  removeAssertionsInProduction?: boolean;
  hot?: boolean;
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
            lightningcssPlugin({
              browsers: browserslist,
              cssModules: false,
              lightningcssOptions: {
                minify: isProductionBuild,
                sourceMap: true,
              },
            }),
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
        'preset-default',
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
