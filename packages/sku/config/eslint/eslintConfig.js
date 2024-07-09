const { eslintDecorator } = require('../../context');

const coreConfig = require.resolve('eslint-config-seek');

const baseConfig = [coreConfig, require.resolve('./importOrderConfig')];

module.exports = eslintDecorator(baseConfig);
