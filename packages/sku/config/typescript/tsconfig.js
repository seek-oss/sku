const { cwd } = require('../../lib/cwd');
const { rootResolution, tsconfigDecorator } = require('../../context');

module.exports = () => {
  const config = {
    compilerOptions: {
      // Don't compile anything, only perform type checking
      noEmit: true,

      // Emit build information for faster subsequent type checking
      incremental: true,
      // Emit build information to `node_modules` to avoid bloating the project root
      // and ignore files
      outDir: 'node_modules',

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
