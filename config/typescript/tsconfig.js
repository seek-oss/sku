const { cwd, getPathFromCwd } = require('../../lib/cwd');
const { paths, rootResolution } = require('../../context');

module.exports = () => {
  const includePaths =
    paths.appSkuConfigPath && paths.appSkuConfigPath.endsWith('.ts')
      ? [...paths.src, paths.appSkuConfigPath]
      : paths.src;

  const config = {
    compilerOptions: {
      // This flag allows tsc to be invoked directly by VS Code (via Cmd+Shift+B),
      // otherwise it would emit a bunch of useless JS/JSX files in your project.
      // We emit compiled JavaScript into `dist` via webpack + Babel, not tsc.
      noEmit: true,

      // Fixes https://github.com/cypress-io/cypress/issues/1087
      skipLibCheck: true,

      esModuleInterop: true,
      allowSyntheticDefaultImports: true,
      resolveJsonModule: true,
      noUnusedLocals: true,
      strict: true,
      jsx: 'preserve',
      lib: ['dom', 'es2015'],
      target: 'es5',
    },
    include: includePaths,
    exclude: [getPathFromCwd('node_modules')],
  };

  if (rootResolution) {
    config.compilerOptions.paths = {
      '*': ['*'],
    };

    config.compilerOptions.baseUrl = cwd();
  }

  return config;
};
