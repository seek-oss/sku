const uniq = require('lodash/uniq');
const defaultSupportedBrowsers = require('browserslist-config-seek');
const {
  makeJsLoaders,
  makeCssLoaders,
  makeCssInJsLoaders,
  makeImageLoaders,
  makeSvgLoaders,
  TYPESCRIPT,
  JAVASCRIPT,
  CSS_IN_JS,
  LESS,
  IMAGE,
  SVG,
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
      isProductionBuild,
      libraryName,
      MiniCssExtractPlugin,
    } = this.options;

    const rules = [
      {
        test: TYPESCRIPT,
        include: this.include,
        use: makeJsLoaders({ target, lang: 'ts', supportedBrowsers }),
      },
      {
        test: JAVASCRIPT,
        include: this.include,
        use: makeJsLoaders({ target, lang: 'js', supportedBrowsers }),
      },
      {
        test: CSS_IN_JS,
        oneOf: this.compilePackages
          .map(packageName => ({
            include: resolvePackage(packageName),
            use: makeCssInJsLoaders({
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
            use: makeCssInJsLoaders({
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
        test: LESS,
        oneOf: this.compilePackages
          .map(packageName => ({
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
      MiniCssExtractPlugin,
    }).apply(compiler);
  }
}

module.exports = SkuWebpackPlugin;
