// @ts-check

/**
 * Create a new ESLint ignores configuration object
 *
 * @param {object} options
 * @param {boolean} options.hasLanguagesConfig - Whether 'languages' is configured in sku config
 * @param {string | undefined} options.target - The configured target directory in sku config
 */
const createEslintIgnoresConfig = ({ hasLanguagesConfig, target }) => {
  // ESLint migrates ignore entries differently depending on whether a path contains a subdirectory.
  // We want the sku target to match the migrated entry so it ends up excluded in the migrated
  // output.
  const targetIgnore =
    target && target.includes('/') ? `${target}/` : `**/${target}/`;

  const ignores =
    /** @type {string[]} */
    (
      [
        hasLanguagesConfig && '**/*.vocab/index.ts',
        '**/.eslintcache',
        '**/eslint.config.js',
        '**/.prettierrc',
        '**/coverage/',
        targetIgnore,
        '**/report/',
        '**/tsconfig.json',
        '**/pnpm-lock.yaml',
      ].filter(Boolean)
    );

  return {
    ignores,
  };
};

module.exports = {
  createEslintIgnoresConfig,
};
