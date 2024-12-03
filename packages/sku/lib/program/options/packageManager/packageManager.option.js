import { Option } from 'commander';

export const packageManagerOption = new Option(
  '-p, --package-manager [type]',
  'Package manager to use when installing dependencies',
);
