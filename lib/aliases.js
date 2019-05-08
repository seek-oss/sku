const fromPairs = require('lodash/fromPairs');
const { join, dirname } = require('path');

const aliases = ['@loadable/component', 'treat'].map(dependency => {
  const packageJsonPath = require.resolve(join(dependency, 'package.json'));
  const packagePath = dirname(packageJsonPath);

  return [dependency, packagePath];
});

const babel = fromPairs(aliases);

// TypeScript expects the value to be an array
const typescriptPaths = fromPairs(
  aliases.map(([key, value]) => [key, [value]]),
);

module.exports = {
  babel,
  typescriptPaths,
};
