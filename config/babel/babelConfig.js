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
    require.resolve('@babel/plugin-proposal-class-properties'),
    require.resolve('@babel/plugin-proposal-object-rest-spread'),
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
      [require.resolve('@babel/preset-env'), envPresetOptions],
      require.resolve('@babel/preset-flow'),
      require.resolve('@babel/preset-react')
    ],
    plugins,
    env: {
      development: {
        plugins: [require.resolve('babel-plugin-flow-react-proptypes')]
      },
      production: {
        plugins: [
          require.resolve('@babel/plugin-transform-react-inline-elements'),
          require.resolve('babel-plugin-transform-react-remove-prop-types'),
          require.resolve('@babel/plugin-transform-react-constant-elements')
        ]
      }
    }
  };
};
