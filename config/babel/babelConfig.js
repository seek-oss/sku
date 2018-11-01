const merge = require('babel-merge');
const supportedBrowsers = require('../browsers/supportedBrowsers');
const builds = require('../builds');
const { cwd } = require('../../lib/cwd');

const browserEnvOptions = {
  modules: false,
  targets: supportedBrowsers
};

const nodeEnvOptions = {
  targets: {
    node: 'current'
  }
};

class BabelHook {
  constructor(config) {
    this.config = config;
  }

  merge(config) {
    this.config = merge(this.config, config);
  }

  getConfig() {
    return this.config;
  }
}

function applyHook(config) {
  if (builds.length === 1) {
    const hook = new BabelHook(config);
    builds[0].hooks.babel.call(hook);
    return hook.getConfig();
  }

  return config;
}

module.exports = ({ target, lang = 'js' }) => {
  const isBrowser = target === 'browser';

  const envPresetOptions = isBrowser ? browserEnvOptions : nodeEnvOptions;
  const plugins = [
    require.resolve('babel-plugin-syntax-dynamic-import'),
    require.resolve('babel-plugin-flow-react-proptypes'),
    require.resolve('@babel/plugin-proposal-class-properties'),
    require.resolve('@babel/plugin-proposal-object-rest-spread'),
    [
      require.resolve('babel-plugin-module-resolver'),
      {
        root: [cwd()]
      }
    ]
  ];

  if (isBrowser) {
    plugins.push(require.resolve('babel-plugin-seek-style-guide'));
  } else {
    plugins.push(require.resolve('babel-plugin-dynamic-import-node'));
  }

  if (process.env.NODE_ENV === 'production') {
    plugins.push(
      require.resolve('@babel/plugin-transform-react-inline-elements'),
      require.resolve('babel-plugin-transform-react-remove-prop-types'),
      require.resolve('@babel/plugin-transform-react-constant-elements')
    );
  }

  const languagePreset =
    lang === 'ts'
      ? [
          require.resolve('@babel/preset-typescript'),
          {
            isTSX: true,
            allExtensions: true
          }
        ]
      : require.resolve('@babel/preset-flow');

  const config = {
    babelrc: false,
    presets: [
      languagePreset,
      [require.resolve('@babel/preset-env'), envPresetOptions],
      require.resolve('@babel/preset-react')
    ],
    plugins
  };

  return applyHook(config);
};
