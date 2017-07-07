const webpack = require('webpack');
const StaticSiteGeneratorPlugin = require('static-site-generator-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const builds = require('../builds');
const lodash = require('lodash');
const flatten = require('lodash/flatten');
const args = require('../args');
const isProductionBuild = process.env.NODE_ENV === 'production';
const thirdPartyModulesRegex = /node_modules\/(?!(seek-style-guide)\/).*/;

const jsLoaders = [
  {
    loader: require.resolve('babel-loader'),
    options: require('../babel/babel.config')({ webpack: true })
  }
];

const makeCssLoaders = (options = {}) => {
  const { server = false, styleGuide = false } = options;

  const debugIdent = isProductionBuild
    ? ''
    : `${styleGuide ? '__STYLE_GUIDE__' : ''}[name]__[local]___`;

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

const buildWebpackConfigs = builds.map(({ name, paths, env }) => {
  const envVars = lodash
    .chain(env)
    .mapValues((value, key) => {
      if (typeof value !== 'object') {
        return JSON.stringify(value);
      }

      const valueForProfile = value[args.profile];

      if (typeof valueForProfile === 'undefined') {
        console.log(
          `WARNING: Environment variable "${key}" for build "${name}" is missing a value for the "${args.profile}" profile`
        );
        process.exit(1);
      }

      return JSON.stringify(valueForProfile);
    })
    .mapKeys((value, key) => `process.env.${key}`)
    .value();

  return [
    {
      entry: paths.clientEntry,
      output: {
        path: paths.dist,
        filename: '[name].js'
      },
      module: {
        rules: [
          {
            test: /\.js$/,
            exclude: thirdPartyModulesRegex,
            use: jsLoaders
          },
          {
            test: /\.js$/,
            include: thirdPartyModulesRegex,
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
            test: /\.less$/,
            exclude: /node_modules/,
            use: ExtractTextPlugin.extract({
              fallback: 'style-loader',
              use: makeCssLoaders()
            })
          },
          {
            test: /\.less$/,
            include: paths.seekStyleGuide,
            use: ExtractTextPlugin.extract({
              fallback: 'style-loader',
              use: makeCssLoaders({ styleGuide: true })
            })
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
            test: /\.js$/,
            exclude: thirdPartyModulesRegex,
            use: jsLoaders
          },
          {
            test: /\.less$/,
            exclude: /node_modules/,
            use: makeCssLoaders({ server: true })
          },
          {
            test: /\.less$/,
            include: paths.seekStyleGuide,
            use: makeCssLoaders({ server: true, styleGuide: true })
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
        new StaticSiteGeneratorPlugin()
      ]
    }
  ];
});

module.exports = flatten(buildWebpackConfigs);
