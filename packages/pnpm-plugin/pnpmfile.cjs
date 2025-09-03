// @ts-check
module.exports = {
  hooks: {
    /** @param {import("@pnpm/types").PnpmSettings} config */
    updateConfig(config) {
      // @ts-expect-error Property isn't in PnpmSettings for some reason
      config.publicHoistPattern ??= [];
      // @ts-expect-error Property isn't in PnpmSettings for some reason
      config.publicHoistPattern.push('eslint', 'prettier');

      config.onlyBuiltDependencies ??= [];
      config.onlyBuiltDependencies.push(
        'sku',
        '@swc/core',
        'esbuild',
        'unrs-resolver',
      );

      config.ignoredBuiltDependencies ??= [];
      config.ignoredBuiltDependencies.push('core-js', 'core-js-pure');

      return config;
    },
  },
};
