const webpack = require('webpack');
const StaticSiteGeneratorPlugin = require('static-site-generator-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const builds = require('../builds');
const lodash = require('lodash');
const flatten = require('lodash/flatten');
const args = require('../args');
const path = require('path');
const supportedBrowsers = require('../browsers/supportedBrowsers');
const isProductionBuild = process.env.NODE_ENV === 'production';

const jsLoaders = [
  {
    loader: require.resolve('babel-loader'),
    options: require('../babel/babelConfig')({ target: 'webpack' })
  }
];

const packageNameToClassPrefix = packageName =>
  `__${packageName
    .match(/([^\/]*)$/)[0]
    .toUpperCase()
    .replace(/[\/\-]/g, '_')}__`;

const makeCssLoaders = (options = {}) => {
  const { server = false, packageName = '', js = false } = options;

  const debugIdent = isProductionBuild
    ? ''
    : `${
        packageName ? packageNameToClassPrefix(packageName) : ''
      }[name]__[local]___`;

  const cssInJsLoaders = [
    { loader: require.resolve('css-in-js-loader') },
    ...jsLoaders
  ];

  return (cssLoaders = [
    {
      loader: require.resolve(`css-loader${server ? '/locals' : ''}`),
      options: {
        modules: true,
        localIdentName: `${debugIdent}[hash:base64:7]`,
        minimize: isProductionBuild,
        importLoaders: 3
      }
    },
    {
      loader: require.resolve('postcss-loader'),
      options: {
        plugins: () => [require('autoprefixer')(supportedBrowsers)]
      }
    },
    {
      loader: require.resolve('less-loader')
    },
    {
      // Hacky fix for https://github.com/webpack-contrib/css-loader/issues/74
      loader: require.resolve('string-replace-loader'),
      options: {
        search: '(url\\([\'"]?)(.)',
        replace: '$1\\$2',
        flags: 'g'
      }
    },
    ...(js ? cssInJsLoaders : [])
  ]);
};

const makeImageLoaders = (options = {}) => {
  const { server = false } = options;

  return [
    {
      loader: require.resolve('url-loader'),
      options: {
        limit: server ? 999999999 : 10000
      }
    }
  ];
};

const svgLoaders = [
  {
    loader: require.resolve('raw-loader')
  },
  {
    loader: require.resolve('svgo-loader'),
    options: {
      plugins: [
        {
          addAttributesToSVGElement: {
            attribute: 'focusable="false"'
          }
        },
        {
          removeViewBox: false
        }
      ]
    }
  }
];

const buildWebpackConfigs = builds.map(
  ({
    name,
    paths,
    env,
    locales,
    webpackDecorator,
    port,
    outputFilename,
    outputCssFilename,
    publicPath
  }) => {
    const envVars = lodash
      .chain(env)
      .mapValues((value, key) => {
        if (typeof value !== 'object') {
          return JSON.stringify(value);
        }

        const valueForEnv = value[args.env];

        if (typeof valueForEnv === 'undefined') {
          console.log(
            `WARNING: Environment variable "${key}" for build "${name}" is missing a value for the "${
              args.env
            }" environment`
          );
          process.exit(1);
        }

        return JSON.stringify(valueForEnv);
      })
      .set('SKU_ENV', JSON.stringify(args.env))
      .set('PORT', JSON.stringify(port))
      .mapKeys((value, key) => `process.env.${key}`)
      .value();

    const internalJs = [paths.src, ...paths.compilePackages];

    return [
      {
        entry: {
          main: paths.clientEntry,
          render: paths.renderEntry
        },
        output: {
          path: paths.dist,
          filename: outputFilename,
          publicPath,
          libraryTarget: 'umd'
        },
        module: {
          rules: [
            {
              test: /(?!\.css)\.js$/,
              include: internalJs,
              use: jsLoaders
            },
            {
              test: /(?!\.css)\.js$/,
              exclude: internalJs,
              use: [
                {
                  loader: require.resolve('babel-loader'),
                  options: {
                    babelrc: false,
                    presets: [require.resolve('babel-preset-env')]
                  }
                }
              ]
            },
            {
              test: /\.css\.js$/,
              use: ExtractTextPlugin.extract({
                fallback: 'style-loader',
                use: makeCssLoaders({ js: true })
              })
            },
            {
              test: /\.less$/,
              exclude: /node_modules/,
              use: ExtractTextPlugin.extract({
                fallback: 'style-loader',
                use: makeCssLoaders()
              })
            },
            ...paths.compilePackages.map(packageName => ({
              test: /\.less$/,
              include: packageName,
              use: ExtractTextPlugin.extract({
                fallback: 'style-loader',
                use: makeCssLoaders({ packageName })
              })
            })),
            {
              test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/],
              use: makeImageLoaders()
            },
            {
              test: /\.svg$/,
              use: svgLoaders
            }
          ]
        },
        plugins: [
          new webpack.DefinePlugin(envVars),
          new ExtractTextPlugin(outputCssFilename),
          new StaticSiteGeneratorPlugin({
            entry: 'render',
            locals: { isProductionBuild, publicPath }
          })
        ].concat(
          !isProductionBuild
            ? []
            : [
                new webpack.optimize.UglifyJsPlugin(),
                new webpack.DefinePlugin({
                  'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
                }),
                new webpack.optimize.ModuleConcatenationPlugin()
              ]
        )
      }
    ].map(webpackDecorator);
  }
);

module.exports = flatten(buildWebpackConfigs);
