const args = require('../args');
const isCI = require('../../lib/isCI');

const isStartScript = args.script === 'start-ssr' || args.script === 'start';
const defaultPreset = isStartScript ? 'summary' : 'errors-only';

module.exports = {
  colors: !isCI,
  preset: args.stats || defaultPreset,
  timings: isStartScript,
  errors: true,
};
