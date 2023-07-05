const { cwd } = require('../../lib/cwd');
const { rootResolution, tsconfigDecorator } = require('../../context');

module.exports = () => {
  const config = {
    compilerOptions: {
      // This flag allows tsc to be invoked directly by VS Code (via Cmd+Shift+B),
      // otherwise it would emit a bunch of useless JS/JSX files in your project.
      // We emit compiled JavaScript into `dist` via webpack + Babel, not tsc.
      noEmit: true,

      // Fixes https://github.com/cypress-io/cypress/issues/1087
      skipLibCheck: true,

      // When dependencies have `type: module` TypeScript doesn't know how to resolve them,
      // so we need to set this to `bundler` or `node`
      moduleResolution: 'bundler',
      // This is required by `bundler` and for dynamic `import()`
      module: 'es2022',

      // resolution-related
      allowImportingTsExtensions: true,
      allowSyntheticDefaultImports: true,
      esModuleInterop: true,
      isolatedModules: true,
      resolveJsonModule: true,

      // misc
      strict: true,
      forceConsistentCasingInFileNames: true,
      jsx: 'react-jsx',
      lib: ['dom', 'es2022'],
      target: 'es2022',
    },
  };

  if (rootResolution) {
    config.compilerOptions.paths = {
      '*': ['*'],
    };
    config.compilerOptions.baseUrl = cwd();
  }

  return tsconfigDecorator(config);
};
