const isCI = require('../../lib/isCI');

const getStatsConfig = ({ stats, isStartScript }) => {
  const defaultPreset = isStartScript ? 'summary' : 'errors-only';

  return {
    colors: !isCI,
    preset: stats || defaultPreset,
    timings: isStartScript,
    errors: true,
  };
};

module.exports = getStatsConfig;
