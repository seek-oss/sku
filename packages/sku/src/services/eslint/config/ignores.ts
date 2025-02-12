/**
 * Create a new ESLint ignores configuration object
 */
export const createEslintIgnoresConfig = ({
  hasLanguagesConfig,
  target,
}: {
  // Whether 'languages' is configured in sku config
  hasLanguagesConfig: boolean;
  // The configured target directory in sku config
  target: string | undefined;
}) => {
  // ESLint migrates ignore entries differently depending on whether a path contains a subdirectory.
  // We want the sku target to match the migrated entry so it ends up excluded in the migrated
  // output.
  const targetIgnore =
    target && target.includes('/') ? `${target}/` : `**/${target}/`;

  const ignores = [
    hasLanguagesConfig && '**/*.vocab/index.ts',
    '**/.eslintcache',
    '**/eslint.config.mjs',
    '**/.prettierrc',
    '**/coverage/',
    targetIgnore,
    '**/report/',
    '**/tsconfig.json',
    '**/pnpm-lock.yaml',
  ].filter(Boolean) as string[];

  return {
    ignores,
  };
};
