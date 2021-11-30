const { cwd } = require('../../lib/cwd');
const { paths, rootResolution } = require('../../context');
const path = require('path');

module.exports = () => {
  const includePaths = paths.src;

  if (paths.appSkuConfigPath && paths.appSkuConfigPath.endsWith('.ts')) {
    // If the config file is in TypeScript, it needs to be included in the tsconfig
    includePaths.push(paths.appSkuConfigPath);
  } else {
    // If it isn't, the placeholder file needs to be included so we don't break JS only projects.
    // See the comments in placeholder.ts
    includePaths.push(path.join(__dirname, '../../lib/placeholder.ts'));
  }

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
  };

  if (rootResolution) {
    config.compilerOptions.paths = {
      '*': ['*'],
    };

    config.compilerOptions.baseUrl = cwd();
  }

  return config;
};
