const webpack = require('webpack')
const path = require('path')

module.exports = {
  devtool: 'source-map',
  entry: {
    'app': [
      'babel-polyfill',
      'react-hot-loader/patch',
      './src/client'
    ]
  },
  output: {
    path: path.resolve(__dirname, './dist'),
    filename: '[name].js'
  },
  module: {
    rules: [
      { 
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        options: {
          presets: [
            [require.resolve('babel-preset-es2015'), { modules: false } ],
            require.resolve('babel-preset-react')
          ],
          plugins: [require('react-hot-loader/babel')]
        }
      },
       
    ]
  }
}
