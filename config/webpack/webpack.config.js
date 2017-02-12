const webpack = require('webpack');
const StaticSiteGeneratorPlugin = require('static-site-generator-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const path = require('path');
const cwd = process.cwd();
const dist = path.join(cwd, 'dist');
const isProductionBuild = process.env.NODE_ENV === 'production';

const jsLoaders = [
  {
    loader: require.resolve('babel-loader'),
    options: require('../babel/babel.config')
  }
];

const cssLoaders = [
  {
    loader: require.resolve('css-loader'),
    options: {
      modules: true,
      minimize: isProductionBuild
    }
  },
  {
    loader: require.resolve('less-loader')
  }
];

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
          use: jsLoaders
        },
        {
          test: /\.less$/,
          use: ExtractTextPlugin.extract({
            fallback: 'style-loader',
            use: cssLoaders
          })
        },
        {
          test: /\.svg$/,
          use: svgLoaders
        }
      ]
    },
    plugins: [
      new ExtractTextPlugin('style.css')
    ].concat(!isProductionBuild ? [] : [
      new webpack.optimize.UglifyJsPlugin(),
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
      })
    ])
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
          use: jsLoaders
        },
        {
          test: /\.less$/,
          use: cssLoaders
        },
        {
          test: /\.svg$/,
          use: svgLoaders
        }
      ]
    },
    plugins: [
      new StaticSiteGeneratorPlugin('render', '/')
    ]
  }
];
