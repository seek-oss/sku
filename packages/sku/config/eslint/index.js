// @ts-check
// @ts-expect-error `eslint-config-seek` has no types yet
const eslintConfigSeek = require('eslint-config-seek');
const { importOrderConfig } = require('./importOrder.js');
const { createEslintIgnoresConfig } = require('./ignores.js');
const {
  eslintDecorator,
  eslintIgnore,
  languages,
  paths: { relativeTarget },
} = require('../../context/index.js');

const _eslintConfigSku = [
  createEslintIgnoresConfig({
    hasLanguagesConfig: Boolean(languages && languages.length > 0),
    target: relativeTarget,
  }),
  ...eslintConfigSeek,
  importOrderConfig,
  ...(eslintIgnore && eslintIgnore.length > 0
    ? [{ ignores: eslintIgnore }]
    : []),
];

module.exports = {
  // @ts-expect-error TypeScript will complain until `eslint-config-seek` has types
  eslintConfigSku: eslintDecorator?.(_eslintConfigSku),
};
