const eslintConfigSeek = require('eslint-config-seek');
const { importOrderConfig } = require('./importOrder.js');
const { ignores: skuEslintIgnores } = require('./ignores.js');
const { eslintDecorator, eslintIgnore } = require('../../context/index.js');

const _eslintConfigSku = [
  skuEslintIgnores,
  ...eslintConfigSeek,
  importOrderConfig,
  ...(eslintIgnore.length > 0 ? [eslintIgnore] : []),
];

module.exports = {
  eslintConfigSku: eslintDecorator(_eslintConfigSku),
};
