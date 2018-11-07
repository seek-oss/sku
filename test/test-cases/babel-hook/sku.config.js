const { BabelHook } = require('../../../hooks');

console.log({ BabelHook });
module.exports = {
  entry: {
    client: 'src/client.js',
    render: 'src/render.js'
  },
  target: 'dist',
  publicPath: '/',
  port: 8080,
  hooks: [
    new BabelHook({
      plugins: [
        [
          'transform-define',
          {
            'process.env.GREETING': 'BabelHook success!'
          }
        ]
      ]
    })
  ]
};
