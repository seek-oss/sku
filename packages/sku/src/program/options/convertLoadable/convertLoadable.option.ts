import { Option } from 'commander';

export const convertLoadableOption = new Option(
  '--convert-loadable',
  'Convert webpack loadable imports to vite imports. Only works when using vite as the bundler.',
).default(false);
