const builds = require('../builds');
const supportedBrowsers = require('../browsers/supportedBrowsers');

// Decorate Babel config is not supported for monorepo
const babelDecorator =
  builds.length === 1 && builds[0].babelDecorator
    ? builds[0].babelDecorator
    : config => config;

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
    require.resolve('babel-plugin-flow-react-proptypes'),
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

  if (process.env.NODE_ENV === 'production') {
    plugins.push(
      require.resolve('@babel/plugin-transform-react-inline-elements'),
      require.resolve('babel-plugin-transform-react-remove-prop-types'),
      require.resolve('@babel/plugin-transform-react-constant-elements')
    );
  }

  return babelDecorator({
    babelrc: false,
    presets: [
      [require.resolve('@babel/preset-env'), envPresetOptions],
      require.resolve('@babel/preset-flow'),
      require.resolve('@babel/preset-react')
    ],
    plugins
  });
};
