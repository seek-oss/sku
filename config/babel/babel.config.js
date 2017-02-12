module.exports = {
  babelrc: false,
  presets: [
    require.resolve('babel-preset-es2015'),
    require.resolve('babel-preset-react')
  ],
  plugins: [
    require.resolve('babel-plugin-transform-class-properties'),
    require.resolve('babel-plugin-transform-object-rest-spread')
  ],
  env: {
    production: {
      presets: [
        require.resolve('babel-preset-react-optimize')
      ]
    }
  }
};
