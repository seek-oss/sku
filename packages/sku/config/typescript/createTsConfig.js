const { cwd } = require('../../lib/cwd');
const { rootResolution, tsconfigDecorator } = require('../../context');
const { baseTsConfig } = require('./tsconfig.js');

const createTsConfig = () => {
  if (rootResolution) {
    baseTsConfig.compilerOptions.paths = {
      '*': ['*'],
    };
    baseTsConfig.compilerOptions.baseUrl = cwd();
  }

  return tsconfigDecorator(baseTsConfig);
};

module.exports = { createTsConfig, baseTsConfig };
