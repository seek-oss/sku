// @ts-check
import isCI from '../../lib/isCI.js';

/**
 * @param {object} [options]
 * @param {string} [options.stats]
 * @param {boolean} [options.isStartScript]
 */
const getStatsConfig = ({ stats, isStartScript = false } = {}) => {
  const defaultPreset = isStartScript ? 'summary' : 'errors-only';

  return {
    colors: !isCI,
    preset: stats || defaultPreset,
    timings: isStartScript,
    errors: true,
  };
};

export default getStatsConfig;
