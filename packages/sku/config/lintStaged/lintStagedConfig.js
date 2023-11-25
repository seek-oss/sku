const { isYarn } = require('../../lib/packageManager');
const { lintExtensions } = require('../../lib/lint');
const { getCommand } = require('@antfu/ni');

/**
 * @type {import('lint-staged').Config}
 */
const config = {
  [`**/*.{${lintExtensions},md,less}`]: ['sku format', 'sku lint'],
};

// Yarn lock integrity check
if (isYarn) {
  config['+(package.json|yarn.lock)'] = [
    getCommand('yarn', 'install', ['--check-files']),
  ];
}

module.exports = config;
