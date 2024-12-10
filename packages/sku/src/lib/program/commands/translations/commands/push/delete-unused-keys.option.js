import { Option } from 'commander';

export const deleteUnusedKeysOption = new Option(
  '--delete-unused-keys',
  'delete unused keys',
).default(false);
