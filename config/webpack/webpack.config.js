const webpack = require('webpack');
const StaticSiteGeneratorPlugin = require('static-site-generator-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const builds = require('../builds');
const lodash = require('lodash');
const flatten = require('lodash/flatten');
const args = require('../args');
const path = require('path');
const isProductionBuild = process.env.NODE_ENV === 'production';
const nodeExternals = require('webpack-node-externals');
const StartServerPlugin = require('start-server-webpack-plugin');

const jsLoaders = [
  {
    loader: require.resolve('babel-loader'),
    options: require('../babel/babel.config')({ webpack: true })
  }
];

const packageToClassPrefix = name =>
  `__${name.match(/([^\/]*)$/)[0].toUpperCase().replace(/[\/\-]/g, '_')}__`;

const makeCssLoaders = (options = {}) => {
  const { server = false, package = '', js = false } = options;

  const debugIdent = isProductionBuild
    ? ''
    : `${package ? packageToClassPrefix(package) : ''}[name]__[local]___`;

  const cssInJsLoaders = [
    { loader: require.resolve('css-in-js-loader') },
    ...jsLoaders
  ];

  return (cssLoaders = [
    ...(isProductionBuild || server ? [] : ['style-loader']),
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
      .set('PORT', JSON.stringify(port.length > 1 ? port[1] : ''))
      .mapKeys((value, key) => `process.env.${key}`)
      .value();

    const internalJs = [paths.src, ...paths.compilePackages];

    const isRender = !!paths.renderEntry;
    const isStartScript = args.script === 'start';

    const clientEntry = [paths.clientEntry];
    const clientDevServerEntries = [
      'react-hot-loader/patch',
      `${require.resolve(
        'webpack-dev-server/client'
      )}?http://localhost:${port[0]}/`,
      `${require.resolve('webpack/hot/only-dev-server')}`
    ];
    const serverEntry = paths.renderEntry || [
      path.join(__dirname, '../server/index.js')
    ];
    const serverDevServerEntries = [
      `${require.resolve('webpack/hot/poll')}?1000`
    ];

    if (isStartScript) {
      clientEntry.unshift(...clientDevServerEntries);
      if (!isRender) {
        serverEntry.unshift(...serverDevServerEntries);
      }
    }

    return [
      {
        entry: clientEntry,
        devtool: 'inline-source-map',
        output: {
          path: paths.dist,
          filename: '[name].js',
          publicPath: isStartScript ? `http://localhost:${port[0]}/` : ''
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
              use: isStartScript
                ? makeCssLoaders({ js: true })
                : ExtractTextPlugin.extract({
                    fallback: 'style-loader',
                    use: makeCssLoaders({ js: true })
                  })
            },
            {
              test: /\.less$/,
              exclude: /node_modules/,
              use: isStartScript
                ? makeCssLoaders()
                : ExtractTextPlugin.extract({
                    fallback: 'style-loader',
                    use: makeCssLoaders()
                  })
            },
            ...paths.compilePackages.map(package => ({
              test: /\.less$/,
              include: package,
              use: isStartScript
                ? makeCssLoaders({ package })
                : ExtractTextPlugin.extract({
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
          isStartScript
            ? [
                new webpack.NamedModulesPlugin(),
                new webpack.HotModuleReplacementPlugin(),
                new webpack.NoEmitOnErrorsPlugin()
              ]
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
        entry: serverEntry,
        watch: isStartScript,
        externals: isRender
          ? []
          : [
              nodeExternals({
                whitelist: ['webpack/hot/poll?1000', /.-style-guide/]
              })
            ],
        resolve: {
          alias: isRender
            ? {}
            : {
                __sku_alias__serverEntry: paths.serverEntry
              }
        },
        target: isRender ? 'web' : 'node',
        node: isRender
          ? {}
          : {
              __dirname: false
            },
        output: {
          path: paths.dist,
          filename: isRender ? 'render.js' : 'server.js',
          libraryTarget: isRender ? 'umd' : 'var'
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
              use: makeCssLoaders({ server: true, js: true })
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
        plugins: isRender
          ? [
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
          : isStartScript
            ? [
                new StartServerPlugin('server.js'),
                new webpack.NamedModulesPlugin(),
                new webpack.HotModuleReplacementPlugin(),
                new webpack.NoEmitOnErrorsPlugin(),
                new webpack.DefinePlugin(envVars)
              ]
            : [new webpack.DefinePlugin(envVars)]
      }
    ].map(webpackDecorator);
  }
);

module.exports = flatten(buildWebpackConfigs);
