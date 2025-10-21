import { Option } from 'commander';

const statsChoices = [
  'errors-only',
  'errors-warnings',
  'minimal',
  'none',
  'normal',
  'verbose',
  'detailed',
  'summary',
] as const;

export type StatsChoices = (typeof statsChoices)[number];

export const statsOption = new Option(
  '-s, --stats <preset>',
  'Webpack stats preset to pass through to webpack',
).choices(statsChoices);
