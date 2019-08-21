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
steps['**/*.{js,jsx,ts,tsx,md,less,css}'] = [
  `sku format`,
  `sku lint`,
  'git add',
];

module.exports = steps;
