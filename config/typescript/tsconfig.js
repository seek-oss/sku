const { cwd, getPathFromCwd } = require('../../lib/cwd');
const { paths, isCompilePackage } = require('../../context');

module.exports = () => {
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
    include: paths.src,
    exclude: [getPathFromCwd('node_modules')],
  };

  if (!isCompilePackage) {
    config.compilerOptions.paths = {
      '*': ['*'],
    };

    config.compilerOptions.baseUrl = cwd();
  }

  return config;
};
