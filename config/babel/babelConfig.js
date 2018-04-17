const supportedBrowsers = require('../browsers/supportedBrowsers');

const browserEnvOptions = {
  modules: false,
  targets: supportedBrowsers
};

const nodeEnvOptions = {
  targets: {
    node: 'current'
  }
};

module.exports = ({ target }) => {
  const isBrowser = target === 'browser';

  const envPresetOptions = isBrowser ? browserEnvOptions : nodeEnvOptions;
  const plugins = [
    require.resolve('babel-plugin-syntax-dynamic-import'),
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

  if (isBrowser) {
    plugins.push(require.resolve('babel-plugin-seek-style-guide'));
  } else {
    plugins.push(require.resolve('babel-plugin-dynamic-import-node'));
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
