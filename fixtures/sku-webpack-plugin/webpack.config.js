const HTMLWebackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const SkuWebpackPlugin = require('sku/webpack-plugin');

module.exports = {
  entry: './main.js',
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              babelrc: false,
              presets: [['@babel/preset-react', { runtime: 'automatic' }]],
            },
          },
        ],
      },
    ],
  },
  plugins: [
    new HTMLWebackPlugin(),
    new SkuWebpackPlugin({
      target: 'browser',
      MiniCssExtractPlugin,
    }),
    new MiniCssExtractPlugin({
      filename: '[name].css',
      chunkFilename: '[id].css',
    }),
  ],
  devServer: {
    port: 9876,
  },
};
