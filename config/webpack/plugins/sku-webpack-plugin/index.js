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

const isCI = process.env.CI === 'true';

class SkuWebpackPlugin {
  constructor(options = {}) {
    validateOptions(options);

    this.options = {
      include: [],
      hot: false,
      generateCSSTypes: false,
      supportedBrowsers: defaultSupportedBrowsers,
      compilePackages: [],
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
    } = this.options;

    const isProductionBuild = mode === 'production';

    const rules = [
      {
        test: TYPESCRIPT,
        include: this.include,
        use: makeJsLoaders({
          target,
          lang: 'ts',
          supportedBrowsers,
          displayNamesProd,
          removeAssertionsInProduction,
        }),
      },
      {
        test: JAVASCRIPT,
        include: this.include,
        use: makeJsLoaders({
          target,
          lang: 'js',
          supportedBrowsers,
          displayNamesProd,
          removeAssertionsInProduction,
        }),
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
        use: makeImageLoaders({ target }),
      },
      { test: SVG, use: makeSvgLoaders() },
      {
        test: DEPRECATED_CSS_IN_JS,
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
    }).apply(compiler);
  }
}

module.exports = SkuWebpackPlugin;
