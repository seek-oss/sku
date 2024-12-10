import { Option } from 'commander';

export const watchOption = new Option(
  '-w, --watch',
  'Watch for changes',
).default(false);
