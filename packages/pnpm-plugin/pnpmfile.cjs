module.exports = {
  hooks: {
    updateConfig(config) {
      config.publicHoistPattern ??= [];
      config.publicHoistPattern.push('eslint', 'prettier');

      config.onlyBuiltDependencies ??= [];
      config.onlyBuiltDependencies.push(
        'sku',
        '@swc/core',
        'esbuild',
        'unrs-resolver',
      );

      config.ignoreBuiltDependencies ??= [];
      config.ignoreBuiltDependencies.push('core-js', 'core-js-pure');

      return config;
    },
  },
};
