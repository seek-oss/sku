import webpack, { type Compiler, type WebpackPluginInstance } from 'webpack';
import defaultSupportedBrowsers from 'browserslist-config-seek';
import { VanillaExtractPlugin } from '@vanilla-extract/webpack-plugin';
import {
  makeJsLoaders,
  makeExternalCssLoaders,
  makeSvgLoaders,
  TYPESCRIPT,
  JAVASCRIPT,
  IMAGE,
  SVG,
  resolvePackage,
} from '../../utils/index.js';
import defaultCompilePackages from '@/context/defaultCompilePackages.js';
import validateOptions, {
  type SkuWebpackPluginOptions,
} from './validateOptions.js';
import targets from '@/config/targets.json' with { type: 'json' };
import { rootResolutionFileExtensions } from '@/config/fileResolutionExtensions.js';

class SkuWebpackPlugin implements WebpackPluginInstance {
  options: SkuWebpackPluginOptions;
  compilePackages: string[];
  include: string[];

  constructor(options: SkuWebpackPluginOptions) {
    validateOptions(options);

    this.options = {
      // Is this default value correct? I imagine it will be set via the options.
      include: [],
      hot: false,
      generateCSSTypes: false,
      browserslist: defaultSupportedBrowsers as unknown as string[],
      compilePackages: [],
      rootResolution: false,
      ...options,
    };
    this.compilePackages = [
      ...new Set([
        ...defaultCompilePackages,
        ...(this.options.compilePackages || []),
      ]),
    ];
    this.include = [
      ...(this.options.include || []),
      ...this.compilePackages.map(resolvePackage),
    ];
  }

  apply(compiler: Compiler) {
    const {
      target,
      hot,
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
              browserslist: [targets.browserslistNodeTarget],
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
              browserslist: [targets.browserslistNodeTarget],
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
              target,
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
      compiler.options.resolve.extensions = rootResolutionFileExtensions;
    } else {
      const dedupedExtensions = new Set([
        ...rootResolutionFileExtensions,
        ...compiler.options.resolve.extensions,
      ]);

      compiler.options.resolve.extensions = Array.from(dedupedExtensions);
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

export default SkuWebpackPlugin;
