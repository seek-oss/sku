const { isYarn } = require('../../lib/packageManager');
const { lintExtensions } = require('../../lib/lint');
const { getCommand } = require('@antfu/ni');

const steps = {};

// Yarn lock integrity check
if (isYarn) {
  steps['+(package.json|yarn.lock)'] = [
    () => getCommand('yarn', 'install', ['--check-files']),
  ];
}

// Format & lint
steps[`**/*.{${lintExtensions},md,less}`] = ['sku format', 'sku lint'];

module.exports = steps;
