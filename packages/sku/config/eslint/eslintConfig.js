const { eslintDecorator, orderImports } = require('../../context');

const coreConfig = require.resolve('eslint-config-seek');

const baseConfig = {
  extends: orderImports
    ? [coreConfig, require.resolve('./importOrderConfig')]
    : coreConfig,
  rules: {
    // Temporarily disable this rule until eslint-config-seek is updated.
    // This goes hand-in-hand with `compilerOptions.jsx: 'react-jsx'` in tsconfig.json
    'react/react-in-jsx-scope': 'off',
  },
};

module.exports = eslintDecorator(baseConfig);
