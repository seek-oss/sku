// @ts-check

/**
 * Create a new ESLint ignores configuration object
 *
 * @param {object} options
 * @param {boolean} options.hasLanguagesConfig - Whether 'languages' is configured in sku config
 * @param {string | undefined} options.target - The configured target directory in sku config
 */
const createEslintIgnoresConfig = ({ hasLanguagesConfig, target }) => {
  const ignores = [
    hasLanguagesConfig && '**/*.vocab/index.ts',
    '**/.eslintcache',
    '**/eslint.config.js',
    '**/.prettierrc',
    '**/coverage/',
    target && `**/${target}/`,
    '**/report/',
    '**/tsconfig.json',
    '**/pnpm-lock.yaml',
  ].filter(Boolean);

  return {
    ignores,
  };
};

module.exports = {
  createEslintIgnoresConfig,
};
