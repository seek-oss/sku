const { getPathFromCwd } = require('../cwd');
const fs = require('node:fs');
const _validatePeerDeps = require('../validatePeerDeps');
const { log } = require('./debug');

let skipConfigure = false;
let skipValidatePeerDeps = false;
const packageJson = getPathFromCwd('./package.json');
const packageJsonExists = fs.existsSync(packageJson);

if (packageJsonExists) {
  const {
    skuSkipConfigure = false,
    skuSkipValidatePeerDeps = false,
  } = require(packageJson);
  skipConfigure = skuSkipConfigure;
  skipValidatePeerDeps = skuSkipValidatePeerDeps;
}

const configureProject = async () => {
  if (skipConfigure) {
    log(`"skuSkipConfigure" set in ${packageJson}, skipping sku configuration`);
    return;
  }

  const configure = require('../configure');
  await configure();
};

const validatePeerDeps = () => {
  if (skipValidatePeerDeps) {
    log(
      `"skuSkipValidatePeerDeps" set in ${packageJson}, skipping sku peer dependency validation`,
    );
    return;
  }

  // Intentionally not awaiting async function as it's just for logging warnings
  _validatePeerDeps();
};

module.exports = {
  configureProject,
  validatePeerDeps,
};
