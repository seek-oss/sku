const webpack = require('webpack');
const uniq = require('lodash/uniq');
const defaultSupportedBrowsers = require('browserslist-config-seek');
const { VanillaExtractPlugin } = require('@vanilla-extract/webpack-plugin');
const {
  makeJsLoaders,
  makeCssLoaders,
  makeExternalCssLoaders,
  makeSvgLoaders,
  TYPESCRIPT,
  JAVASCRIPT,
  LESS,
  IMAGE,
  SVG,
  resolvePackage,
} = require('../../utils');
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
      browserslist: defaultSupportedBrowsers,
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
      browserslist,
      mode = compiler.options.mode,
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
            compiler: /(vanilla-extract)/,
            use: makeJsLoaders({
              target: 'node',
              lang: 'ts',
              browserslist: ['current node'],
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
              browserslist,
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
            compiler: /(vanilla-extract)/,
            use: makeJsLoaders({
              target: 'node',
              lang: 'js',
              browserslist: ['current node'],
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
              browserslist,
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
              browserslist,
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
              browserslist,
            }),
          }),
      },
      {
        test: /\.css$/i,
        oneOf: [
          {
            // All CSS created by vanilla-extract
            test: /\.vanilla\.css$/i,
            // Don't process vanilla files from Playroom as they are handled separately.
            // Virtual file paths will look more realistic in the future allowing
            // more standard handling of include/exclude path matching.
            exclude: /node_modules\/playroom/,
            use: makeExternalCssLoaders({
              isProductionBuild,
              MiniCssExtractPlugin,
              hot,
              browserslist,
            }),
          },
          {
            test: /\.css$/i,
            include: /node_modules/,
            exclude: /node_modules\/playroom/,
            use: makeExternalCssLoaders({
              target,
              isProductionBuild,
              MiniCssExtractPlugin,
              hot,
              browserslist,
            }),
          },
        ],
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

    new VanillaExtractPlugin({
      identifiers: isProductionBuild ? 'short' : 'debug',
      outputCss: target === 'browser',
    }).apply(compiler);

    if (target === 'browser') {
      // Fixes an issue with the "assert" package used by braid referencing process
      new webpack.DefinePlugin({
        'process.env.NODE_DEBUG': JSON.stringify(false),
      }).apply(compiler);
    }
  }
}

module.exports = SkuWebpackPlugin;
