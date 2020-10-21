const { getPathFromCwd } = require('./cwd');

const isCompilePackage = () => {
  try {
    return Boolean(require(getPathFromCwd('package.json')).skuCompilePackage);
  } catch (e) {
    // Assume false if no package.json
    return false;
  }
};

module.exports = isCompilePackage();
