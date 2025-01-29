import isCI from '../../lib/isCI.js';

const getStatsConfig = ({
  stats,
  isStartScript = false,
}: { stats?: string; isStartScript?: boolean } = {}) => {
  const defaultPreset = isStartScript ? 'summary' : 'errors-only';

  return {
    colors: !isCI,
    preset: stats || defaultPreset,
    timings: isStartScript,
    errors: true,
  };
};

export default getStatsConfig;
