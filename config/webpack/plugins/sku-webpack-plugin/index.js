const uniq = require('lodash/uniq');
const defaultSupportedBrowsers = require('browserslist-config-seek');
const {
  makeJsLoaders,
  makeCssLoaders,
  makeImageLoaders,
  makeSvgLoaders,
  TYPESCRIPT,
  JAVASCRIPT,
  LESS,
  IMAGE,
  SVG,
  DEPRECATED_CSS_IN_JS,
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
            compiler: 'treat-webpack-loader',
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
            compiler: 'treat-webpack-loader',
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
        test: IMAGE,
        include: this.include,
        use: makeImageLoaders({ target }),
      },
      {
        test: SVG,
        include: this.include,
        use: makeSvgLoaders(),
      },
      {
        test: DEPRECATED_CSS_IN_JS,
        include: this.include,
        use: require.resolve('../deprecatedCssInJsFileLoader'),
      },
    ];

    compiler.options.module.rules.push(...rules);

    if (!compiler.options.resolve.extensions.includes('.ts')) {
      compiler.options.resolve.extensions.push('.ts');
    }

    if (!compiler.options.resolve.extensions.includes('.tsx')) {
      compiler.options.resolve.extensions.push('.tsx');
    }

    createTreatPlugin({
      target,
      isProductionBuild,
      include: this.include,
      libraryName,
      supportedBrowsers,
      MiniCssExtractPlugin,
      hot,
    }).apply(compiler);
  }
}

module.exports = SkuWebpackPlugin;
