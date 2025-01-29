import { Option } from 'commander';

export const configOption = new Option(
  '-c, --config [config]',
  'Path to your sku config file',
);
