const { cwd, getPathFromCwd } = require('../../lib/cwd');
const { paths } = require('../../context');

module.exports = () => ({
  compilerOptions: {
    esModuleInterop: true,
    allowSyntheticDefaultImports: true,
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
