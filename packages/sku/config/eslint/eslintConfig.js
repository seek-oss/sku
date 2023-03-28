const { eslintDecorator, orderImports } = require('../../context');

const coreConfig = require.resolve('eslint-config-seek');

const baseConfig = {
  extends: orderImports
    ? [coreConfig, require.resolve('./importOrderConfig')]
    : coreConfig,
};

module.exports = eslintDecorator(baseConfig);
