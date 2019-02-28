const { eslintDecorator } = require('../../context');
const baseConfig = {
  extends: require.resolve('eslint-config-seek'),
};

module.exports = eslintDecorator(baseConfig);
