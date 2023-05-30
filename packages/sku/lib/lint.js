const {
  js: jsExtensions,
  ts: tsExtensions,
} = require('eslint-config-seek/extensions');

const lintExtensions = [...tsExtensions, ...jsExtensions];

module.exports = { lintExtensions };
