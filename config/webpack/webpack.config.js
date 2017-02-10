const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');
const cwd = process.cwd();
const src = path.join(cwd, 'src');
const dist = path.join(cwd, 'dist');

module.exports = {
  entry: path.join(cwd, 'src/index.js'),
  output: {
    path: dist,
    filename: '[name].js'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
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
          { loader: require.resolve('style-loader') },
          { loader: require.resolve('css-loader'), options: { modules: true } },
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
    new HtmlWebpackPlugin({template: path.join(src, 'index.ejs')})
  ]
};
