const { eslintDecorator, orderImports } = require('../../context');

const coreConfig = require.resolve('eslint-config-seek');

const baseConfig = {
  extends: orderImports
    ? [coreConfig, require.resolve('./importOrderConfig')]
    : coreConfig,
  rules: {
    'react/jsx-uses-react': 'off',
    'react/react-in-jsx-scope': 'off',
  },
};

module.exports = eslintDecorator(baseConfig);
