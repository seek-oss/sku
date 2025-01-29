import { Option } from 'commander';

export const debugOption = new Option(
  '-d, --debug',
  'Enable debug logging.',
).default(false);
