const { cwd, getPathFromCwd } = require('../../lib/cwd');
const { paths } = require('../../context');

module.exports = () => ({
  compilerOptions: {
    skipLibCheck: true, // Fixes https://github.com/cypress-io/cypress/issues/1087
    esModuleInterop: true,
    allowSyntheticDefaultImports: true,
    resolveJsonModule: true,
    noUnusedLocals: true,
    strict: true,
    jsx: 'preserve',
    lib: ['dom', 'es2015'],
    baseUrl: cwd(),
    paths: {
      '*': ['*']
    }
  },
  include: paths.src,
  exclude: [getPathFromCwd('node_modules')]
});
