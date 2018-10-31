const { BabelPlugin } = require('../../../plugins');

module.exports = {
  entry: {
    client: 'src/client.js',
    render: 'src/render.js'
  },
  target: 'dist',
  publicPath: '/',
  port: 8080,
  plugins: [
    new BabelPlugin({
      plugins: [
        [
          'transform-define',
          {
            'process.env.GREETING': 'BabelPlugin success!'
          }
        ]
      ]
    })
  ]
};
