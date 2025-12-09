import { banner } from '@sku-private/utils';
import { Command } from 'commander';

/**
 * @deprecated Will be removed entirely in a future major version. Replaced by `@sku-lib/create`.
 */
export const initCommand = new Command('init')
  .argument('[projectName]', 'Project name')
  .allowExcessArguments(true)
  .allowUnknownOption(true)
  .description('Deprecated. Please use `@sku-lib/create` instead.')
  // .error(`'sku init' is deprecated. Please use '@sku-lib/create' instead.`);
  .action(() => {
    banner('error', '`sku init` is deprecated', [
      'Please use `@sku-lib/create` instead.',
      'https://seek-oss.github.io/sku/#/./docs/getting-started?id=getting-started',
    ]);
    process.exit(1);
  });
