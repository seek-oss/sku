const { eslintDecorator, orderImports } = require('../../context');

const coreConfig = require.resolve('eslint-config-seek');

const baseConfig = {
  extends: orderImports
    ? [coreConfig, require.resolve('./importOrderConfig')]
    : coreConfig,
  // Temporarily configure @typescript-eslint/parser until eslint-config-seek is updated.
  parserOptions: {
    // https://github.com/typescript-eslint/typescript-eslint/issues/6544
    allowAutomaticSingleRunInference: true,
    ecmaVersion: 2022,
    project: true,
    sourceType: 'module',
    warnOnUnsupportedTypeScriptVersion: false,
  },
  rules: {
    // Temporarily disable this rule until eslint-config-seek is updated.
    // This goes hand-in-hand with `compilerOptions.jsx: 'react-jsx'` in tsconfig.json
    'react/react-in-jsx-scope': 'off',
  },
};

module.exports = eslintDecorator(baseConfig);
