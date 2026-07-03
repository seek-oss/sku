import { critical, strong } from '@sku-private/utils/console';

/**
 * Validate `pathAliases`. `sku` mirrors these into the `package.json` `imports`
 * field, which only supports `#`-prefixed subpath import specifiers, and aliases
 * must not point at `node_modules`.
 */
export const validatePathAliases = (pathAliases?: Record<string, string>) => {
  if (!pathAliases) {
    return;
  }

  for (const [alias, destination] of Object.entries(pathAliases) as Array<
    [string, string]
  >) {
    if (!alias.startsWith('#')) {
      console.log(
        critical(
          `Path alias "${strong(alias)}" must start with "#" to be a valid subpath import.`,
        ),
      );
      process.exit(1);
    }

    if (destination.includes('node_modules')) {
      console.log(
        critical(`Path alias "${strong(alias)}" cannot point to node_modules.`),
      );
      process.exit(1);
    }
  }
};
