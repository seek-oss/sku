const webpack = require('webpack');
const uniq = require('lodash/uniq');
const defaultSupportedBrowsers = require('browserslist-config-seek');
const { VanillaExtractPlugin } = require('@vanilla-extract/webpack-plugin');
const {
  makeJsLoaders,
  makeCssLoaders,
  makeVanillaCssLoaders,
  makeSvgLoaders,
  TYPESCRIPT,
  JAVASCRIPT,
  LESS,
  IMAGE,
  SVG,
  resolvePackage,
} = require('../../utils');
const createTreatPlugin = require('../createTreatPlugin');
const defaultCompilePackages = require('../../../../context/defaultCompilePackages');
const validateOptions = require('./validateOptions');

const isCI = require('../../../../lib/isCI');

class SkuWebpackPlugin {
  constructor(options = {}) {
    validateOptions(options);

    this.options = {
      include: [],
      hot: false,
      generateCSSTypes: false,
      supportedBrowsers: defaultSupportedBrowsers,
      compilePackages: [],
      rootResolution: false,
      ...options,
    };
    this.compilePackages = uniq([
      ...defaultCompilePackages,
      ...this.options.compilePackages,
    ]);
    this.include = [
      ...this.options.include,
      ...this.compilePackages.map(resolvePackage),
    ];
  }

  apply(compiler) {
    const {
      target,
      hot,
      generateCSSTypes,
      supportedBrowsers,
      mode = compiler.options.mode,
      libraryName,
      displayNamesProd,
      removeAssertionsInProduction,
      MiniCssExtractPlugin,
      rootResolution,
    } = this.options;

    const isProductionBuild = mode === 'production';

    const rules = [
      {
        test: TYPESCRIPT,
        include: this.include,
        oneOf: [
          {
            compiler: /(vanilla-extract|treat-webpack-loader)/,
            use: makeJsLoaders({
              target: 'node',
              lang: 'ts',
              supportedBrowsers,
              displayNamesProd,
              removeAssertionsInProduction,
              hot: false,
              rootResolution,
            }),
          },
          {
            use: makeJsLoaders({
              target,
              lang: 'ts',
              supportedBrowsers,
              displayNamesProd,
              removeAssertionsInProduction,
              hot,
              rootResolution,
            }),
          },
        ],
      },
      {
        test: JAVASCRIPT,
        include: this.include,
        oneOf: [
          {
            compiler: /(vanilla-extract|treat-webpack-loader)/,
            use: makeJsLoaders({
              target: 'node',
              lang: 'js',
              supportedBrowsers,
              displayNamesProd,
              removeAssertionsInProduction,
              hot: false,
              rootResolution,
            }),
          },
          {
            use: makeJsLoaders({
              target,
              lang: 'js',
              supportedBrowsers,
              displayNamesProd,
              removeAssertionsInProduction,
              hot,
              rootResolution,
            }),
          },
        ],
      },
      {
        test: LESS,
        oneOf: this.compilePackages
          .map((packageName) => ({
            include: resolvePackage(packageName),
            use: makeCssLoaders({
              target,
              isCI,
              isProductionBuild,
              generateCSSTypes,
              MiniCssExtractPlugin,
              packageName,
              hot,
              compilePackage: true,
              supportedBrowsers,
            }),
          }))
          .concat({
            include: this.include,
            use: makeCssLoaders({
              target,
              isCI,
              isProductionBuild,
              generateCSSTypes,
              MiniCssExtractPlugin,
              hot,
              compilePackage: false,
              supportedBrowsers,
            }),
          }),
      },
      {
        // All CSS created by vanilla-extract
        test: /\.vanilla.css$/i,
        use: makeVanillaCssLoaders({
          isProductionBuild,
          MiniCssExtractPlugin,
          hot,
          supportedBrowsers,
        }),
      },
      {
        test: IMAGE,
        include: this.include,
        type: 'asset',
        generator: {
          emit: target === 'browser',
        },
        parser: {
          dataUrlCondition: {
            maxSize: 10000,
          },
        },
      },
      {
        test: SVG,
        include: this.include,
        type: 'asset/source',
        use: makeSvgLoaders(),
      },
    ];

    compiler.options.module.rules.push(...rules);

    if (!compiler.options.resolve.extensions) {
      compiler.options.resolve.extensions = [
        '.mjs',
        '.js',
        '.json',
        '.ts',
        '.tsx',
      ];
    } else {
      if (!compiler.options.resolve.extensions.includes('.ts')) {
        compiler.options.resolve.extensions.push('.ts');
      }

      if (!compiler.options.resolve.extensions.includes('.tsx')) {
        compiler.options.resolve.extensions.push('.tsx');
      }
    }

    createTreatPlugin({
      target,
      isProductionBuild,
      libraryName,
      supportedBrowsers,
      MiniCssExtractPlugin,
    }).apply(compiler);

    if (target === 'browser') {
      new VanillaExtractPlugin().apply(compiler);

      // Fixes an issue with the "assert" package used by braid referencing process
      new webpack.DefinePlugin({
        'process.env.NODE_DEBUG': JSON.stringify(false),
      }).apply(compiler);
    }
  }
}

module.exports = SkuWebpackPlugin;
