const webpack = require('webpack');
const StaticSiteGeneratorPlugin = require('static-site-generator-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const path = require('path');
const cwd = process.cwd();
const distPath = path.join(cwd, 'dist');
const styleGuidePath = path.join(cwd, 'node_modules/seek-style-guide');
const isProductionBuild = process.env.NODE_ENV === 'production';

const jsLoaders = [
  {
    loader: require.resolve('babel-loader'),
    options: require('../babel/babel.config')
  }
];

const makeCssLoaders = (options = {}) => {
  const {
    server = false,
    styleGuide = false
  } = options;

  const debugIdent = isProductionBuild ? '' :
    `${styleGuide ? '__STYLE_GUIDE__' : ''}[name]__[local]___`;

  return [
    {
      loader: require.resolve(`css-loader${server ? '/locals' : ''}`),
      options: {
        modules: true,
        localIdentName: `${debugIdent}[hash:base64:7]`,
        minimize: isProductionBuild
      }
    },
    {
      loader: require.resolve('less-loader')
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

module.exports = [
  {
    entry: path.join(cwd, 'src/client.js'),
    output: {
      path: distPath,
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
          exclude: /node_modules/,
          use: ExtractTextPlugin.extract({
            fallback: 'style-loader',
            use: makeCssLoaders()
          })
        },
        {
          test: /\.less$/,
          include: styleGuidePath,
          use: ExtractTextPlugin.extract({
            fallback: 'style-loader',
            use: makeCssLoaders({ styleGuide: true })
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
      path: distPath,
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
          exclude: /node_modules/,
          use: makeCssLoaders({ server: true })
        },
        {
          test: /\.less$/,
          include: styleGuidePath,
          use: makeCssLoaders({ server: true, styleGuide: true })
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
