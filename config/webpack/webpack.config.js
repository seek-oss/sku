const StaticSiteGeneratorPlugin = require('static-site-generator-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const path = require('path');
const cwd = process.cwd();
const dist = path.join(cwd, 'dist');

module.exports = [
  {
    entry: path.join(cwd, 'src/index.js'),
    output: {
      path: dist,
      filename: '[name].js'
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules\/(?!(seek-style-guide)\/).*/,
          use: [
            {
              loader: require.resolve('babel-loader'),
              options: require('../babel/babel.config')
            }
          ]
        },
        {
          test: /\.less$/,
          use: ExtractTextPlugin.extract({
            fallback: 'style-loader',
            use: [
              { loader: require.resolve('css-loader'), options: { modules: true } },
              { loader: require.resolve('less-loader') }
            ]
          })
        },
        {
          test: /\.svg$/,
          use: [
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
          ]
        }
      ]
    },
    plugins: [
      new ExtractTextPlugin('style.css')
    ]
  },
  {
    entry: {
      render: path.join(cwd, 'src/render.js')
    },
    output: {
      path: dist,
      filename: '[name].js',
      libraryTarget: 'umd'
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules\/(?!(seek-style-guide)\/).*/,
          use: [
            {
              loader: require.resolve('babel-loader'),
              options: require('../babel/babel.config')
            }
          ]
        },
        {
          test: /\.less$/,
          use: [
            { loader: require.resolve('css-loader/locals'), options: { modules: true } },
            { loader: require.resolve('less-loader') }
          ]
        },
        {
          test: /\.svg$/,
          use: [
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
          ]
        }
      ]
    },
    plugins: [
      new StaticSiteGeneratorPlugin('render', '/')
    ]
  }
];
