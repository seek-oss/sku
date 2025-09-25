import { Command } from 'commander';

/**
 * This command is deprecated.
 */
export const initCommand = new Command('init')
  .argument('[projectName]', 'Project name')
  .allowExcessArguments(true)
  .allowUnknownOption(true)
  .description('Deprecated. Please use `@sku-lib/create` instead.')
  .error(
    `
    'sku init' is deprecated. Please use '@sku-lib/create' instead.
    @see https://seek-oss.github.io/sku/#/./docs/getting-started?id=getting-started
    `,
  );
