const supportedBrowsers = require('../browsers/supportedBrowsers');

const webpackEnvOptions = {
  modules: false,
  targets: supportedBrowsers
};

const nodeEnvOptions = {
  targets: {
    node: 'current'
  }
};

module.exports = ({ target }) => {
  const isWebpack = target === 'webpack';

  const envPresetOptions = isWebpack ? webpackEnvOptions : nodeEnvOptions;
  const plugins = [
    require.resolve('babel-plugin-transform-class-properties'),
    require.resolve('babel-plugin-transform-object-rest-spread'),
    [
      require.resolve('babel-plugin-module-resolver'),
      {
        root: [process.cwd()]
      }
    ]
  ];

  if (isWebpack) {
    plugins.push([
      require.resolve('babel-plugin-transform-imports'),
      {
        'seek-style-guide/react': {
          transform: 'seek-style-guide/react/${member}/${member}',
          preventFullImport: true
        }
      }
    ]);
  }

  return {
    babelrc: false,
    presets: [
      [require.resolve('babel-preset-env'), envPresetOptions],
      require.resolve('babel-preset-react')
    ],
    plugins,
    env: {
      production: {
        presets: [require.resolve('babel-preset-react-optimize')]
      }
    }
  };
};
