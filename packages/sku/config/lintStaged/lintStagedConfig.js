const isYarn = require('../../lib/isYarn');
const { lintExtensions } = require('../../lib/lint');

const steps = {};

// Yarn lock integrity check
if (isYarn) {
  steps['+(package.json|yarn.lock)'] = [() => 'yarn install --check-files'];
}

// Format & lint
steps[`**/*.{${lintExtensions},md,less}`] = ['sku format', 'sku lint'];

module.exports = steps;
