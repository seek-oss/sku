const { eslintDecorator } = require('../../context');

const coreConfig = require.resolve('eslint-config-seek');

const baseConfig = {
  extends: [coreConfig, require.resolve('./importOrderConfig')],
};

module.exports = eslintDecorator(baseConfig);
