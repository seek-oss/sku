const webpack = require('webpack');
const StaticSiteGeneratorPlugin = require('static-site-generator-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const builds = require('../builds');
const lodash = require('lodash');
const flatten = require('lodash/flatten');
const args = require('../args');
const path = require('path');
const supportedBrowsers = require('../browsers/supportedBrowsers');
const isProductionBuild = process.env.NODE_ENV === 'production';
const webpackMode = isProductionBuild ? 'production' : 'development';

const makeJsLoaders = ({ target }) => [
  {
    loader: require.resolve('babel-loader'),
    options: require('../babel/babelConfig')({ target })
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
    ...makeJsLoaders({ target: 'node' })
  ];

  return (cssLoaders = [
    {
      // On the server, we use 'css-loader/locals' to avoid generating a CSS file.
      // Only the client build should generate CSS files.
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
        limit: 10000,
        fallback: require.resolve('file-loader'),
        // We only want to emit client assets during the client build.
        // The server build should only emit server-side JS and HTML files.
        emitFile: !server
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
  ({ name, paths, env, locales, webpackDecorator, port, polyfills }) => {
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

    const resolvedPolyfills = polyfills.map(polyfill => {
      return require.resolve(polyfill, { paths: [process.cwd()] });
    });

    const devServerEntries = [
      `${require.resolve(
        'webpack-dev-server/client'
      )}?http://localhost:${port}/`
    ];

    const entry =
      args.script === 'start'
        ? [...resolvedPolyfills, ...devServerEntries, paths.clientEntry]
        : [...resolvedPolyfills, paths.clientEntry];

    const internalJs = [...paths.src, ...paths.compilePackages];
    const publicPath = args.script === 'start' ? '/' : paths.publicPath;

    return [
      {
        name: 'client',
        mode: webpackMode,
        entry,
        output: {
          path: paths.dist,
          publicPath,
          filename: '[name].js'
        },
        optimization: {
          nodeEnv: process.env.NODE_ENV,
          minimize: isProductionBuild,
          concatenateModules: isProductionBuild
        },
        module: {
          rules: [
            {
              test: /(?!\.css)\.js$/,
              include: internalJs,
              use: makeJsLoaders({ target: 'browser' })
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
              use: [MiniCssExtractPlugin.loader].concat(
                makeCssLoaders({ js: true })
              )
            },
            {
              test: /\.mjs$/,
              include: /node_modules/,
              type: 'javascript/auto'
            },
            {
              test: /\.less$/,
              oneOf: [
                ...paths.compilePackages.map(packageName => ({
                  include: packageName,
                  use: [MiniCssExtractPlugin.loader].concat(
                    makeCssLoaders({ packageName })
                  )
                })),
                {
                  exclude: /node_modules/,
                  use: [MiniCssExtractPlugin.loader].concat(makeCssLoaders())
                }
              ]
            },
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
          new MiniCssExtractPlugin({
            filename: 'style.css'
          })
        ]
      },
      {
        name: 'render',
        mode: webpackMode,
        entry: {
          render:
            paths.renderEntry || path.join(__dirname, '../server/server.js')
        },
        target: 'node',
        output: {
          path: paths.dist,
          publicPath,
          filename: 'render.js',
          libraryTarget: 'umd'
        },
        optimization: {
          nodeEnv: process.env.NODE_ENV
        },
        module: {
          rules: [
            {
              test: /(?!\.css)\.js$/,
              include: internalJs,
              use: makeJsLoaders({ target: 'node' })
            },
            {
              test: /\.css\.js$/,
              use: makeCssLoaders({ server: true, js: true })
            },
            {
              test: /\.less$/,
              oneOf: [
                ...paths.compilePackages.map(packageName => ({
                  include: packageName,
                  use: makeCssLoaders({ server: true, packageName })
                })),
                {
                  exclude: /node_modules/,
                  use: makeCssLoaders({ server: true })
                }
              ]
            },

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
                  publicPath,
                  locale
                },
                paths: `index${
                  isProductionBuild && locale ? `-${locale}` : ''
                }.html`
              })
          )
        ]
      }
    ].map(webpackDecorator);
  }
);

module.exports = flatten(buildWebpackConfigs);
