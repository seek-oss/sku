const isYarn = require('../../lib/isYarn');

const steps = {};

// Yarn lock integrity check
if (isYarn) {
  steps['+(package.json|yarn.lock)'] = [
    () => 'yarn check --integrity',
    'git add package.json yarn.lock',
  ];
}

// Format & lint
steps['**/*.{js,ts,tsx,md,less}'] = [`sku format`, `sku lint`, 'git add'];

module.exports = steps;
