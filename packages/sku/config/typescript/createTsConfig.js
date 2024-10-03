const { cwd } = require('../../lib/cwd');
const { rootResolution, tsconfigDecorator } = require('../../context');
const { baseTsConfig } = require('./tsconfig');

const createTsConfig = () => {
  let newTsConfig = {
    ...baseTsConfig,
  };

  if (rootResolution) {
    const newCompilerOptions = {
      ...newTsConfig.compilerOptions,
      paths: { '*': ['*'] },
      baseUrl: cwd(),
    };

    newTsConfig = {
      ...newTsConfig,
      compilerOptions: newCompilerOptions,
    };
  }

  return tsconfigDecorator(newTsConfig);
};

module.exports = { createTsConfig };
