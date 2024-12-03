import { Option } from 'commander';

export const statsOption = new Option(
  '-s, --stats <preset>',
  'Webpack stats preset to pass through to webpack',
).choices([
  'errors-only',
  'errors-warnings',
  'minimal',
  'none',
  'normal',
  'verbose',
  'detailed',
  'summary',
]);
