module.exports = {
  dangerouslySetBabelConfig: config => ({
    ...config,
    plugins: [
      ...config.plugins,
      [
        'transform-define',
        {
          'process.env.GREETING': 'Babel decorator success!'
        }
      ]
    ]
  })
};
