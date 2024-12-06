import HTMLWebackPlugin from 'html-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import SkuWebpackPlugin from 'sku/webpack-plugin';

export default {
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
