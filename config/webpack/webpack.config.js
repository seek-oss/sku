const webpack = require('webpack');
const StaticSiteGeneratorPlugin = require('static-site-generator-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const builds = require('../builds');
const lodash = require('lodash');
const flatten = require('lodash/flatten');
const args = require('../args');
const isProductionBuild = process.env.NODE_ENV === 'production';

const jsLoaders = [
  {
    loader: require.resolve('babel-loader'),
    options: require('../babel/babel.config')({ webpack: true })
  }
];

const packageToClassPrefix = name =>
  `__${name.match(/([^\/]*)$/)[0].toUpperCase().replace(/[\/\-]/g, '_')}__`;

const makeCssLoaders = (options = {}) => {
  const { server = false, package = '' } = options;

  const debugIdent = isProductionBuild
    ? ''
    : `${package ? packageToClassPrefix(package) : ''}[name]__[local]___`;

  return [
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
        plugins: () => [
          require('autoprefixer')({
            browsers: [
              '> 1%',
              'Last 2 versions',
              'ie >= 10',
              'Safari >= 8',
              'iOS >= 8'
            ]
          })
        ]
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
    }
  ];
};

const makeCssInJsLoaders = (options = {}) => {
  const { server = false } = options;

  return [
    {
      loader: require.resolve(`css-loader${server ? '/locals' : ''}`),
      options: {
        modules: true,
        importLoaders: 3
      }
    },
    {
      loader: require.resolve('postcss-loader'),
      options: {
        plugins: () => [
          require('autoprefixer')({
            browsers: [
              '> 1%',
              'Last 2 versions',
              'ie >= 10',
              'Safari >= 8',
              'iOS >= 8'
            ]
          })
        ]
      }
    },
    { loader: require.resolve('css-in-js-loader') },
    ...jsLoaders
  ];
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
        }
      ]
    }
  }
];

const buildWebpackConfigs = builds.map(
  ({ name, paths, env, locales, webpackDecorator, port }) => {
    const envVars = lodash
      .chain(env)
      .mapValues((value, key) => {
        if (typeof value !== 'object') {
          return JSON.stringify(value);
        }

        const valueForEnv = value[args.env];

        if (typeof valueForEnv === 'undefined') {
          console.log(
            `WARNING: Environment variable "${key}" for build "${name}" is missing a value for the "${args.env}" environment`
          );
          process.exit(1);
        }

        return JSON.stringify(valueForEnv);
      })
      .set('SKU_ENV', JSON.stringify(args.env))
      .mapKeys((value, key) => `process.env.${key}`)
      .value();

    const internalJs = [paths.src, ...paths.compilePackages];

    const entry = [paths.clientEntry];
    const devServerEntries = [
      `${require.resolve(
        'webpack-dev-server/client'
      )}?http://localhost:${port}/`
    ];

    if (args.script === 'start') {
      entry.unshift(...devServerEntries);
    }

    return [
      {
        entry,
        output: {
          path: paths.dist,
          filename: '[name].js'
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
                    presets: [require.resolve('babel-preset-es2015')]
                  }
                }
              ]
            },
            {
              test: /\.css\.js$/,
              use: ExtractTextPlugin.extract({
                fallback: 'style-loader',
                use: makeCssInJsLoaders()
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
            ...paths.compilePackages.map(package => ({
              test: /\.less$/,
              include: package,
              use: ExtractTextPlugin.extract({
                fallback: 'style-loader',
                use: makeCssLoaders({ package })
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
          new ExtractTextPlugin('style.css')
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
      },
      {
        entry: {
          render: paths.renderEntry
        },
        output: {
          path: paths.dist,
          filename: '[name].js',
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
              test: /\.css\.js$/,
              use: makeCssInJsLoaders({ server: true })
            },
            {
              test: /\.less$/,
              exclude: /node_modules/,
              use: makeCssLoaders({ server: true })
            },
            ...paths.compilePackages.map(package => ({
              test: /\.less$/,
              include: package,
              use: makeCssLoaders({ server: true, package })
            })),
            {
              test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/],
              use: makeImageLoaders({ server: true })
            },
            {
              test: /\.svg$/,
              use: svgLoaders
            }
          ]
        },
        plugins: [
          new webpack.DefinePlugin(envVars),
          ...locales.slice(0, isProductionBuild ? locales.length : 1).map(
            locale =>
              new StaticSiteGeneratorPlugin({
                locals: {
                  locale
                },
                paths: `index${isProductionBuild && locale
                  ? `-${locale}`
                  : ''}.html`
              })
          )
        ]
      }
    ].map(webpackDecorator);
  }
);

module.exports = flatten(buildWebpackConfigs);
