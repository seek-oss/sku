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
    require.resolve('babel-plugin-flow-react-proptypes'),
    require.resolve('babel-plugin-transform-flow-strip-types'),
    [
      require.resolve('babel-plugin-module-resolver'),
      {
        root: [process.cwd()]
      }
    ]
  ];

  if (isWebpack) {
    plugins.push(require.resolve('babel-plugin-seek-style-guide'));
  }

  return {
    babelrc: false,
    presets: [
      [require.resolve('babel-preset-env'), envPresetOptions],
      require.resolve('babel-preset-react')
    ],
    plugins,
    env: {
      development: {
        plugins: [require.resolve('babel-plugin-flow-react-proptypes')]
      },
      production: {
        presets: [require.resolve('babel-preset-react-optimize')]
      }
    }
  };
};
