import { getPathFromCwd } from '../cwd.js';
import fs from 'node:fs';
import _validatePeerDeps from '../validatePeerDeps.js';
import { log } from './debug.js';

let skipConfigure = false;
let skipValidatePeerDeps = false;
const packageJson = getPathFromCwd('./package.json');
const packageJsonExists = fs.existsSync(packageJson);

if (packageJsonExists) {
  const { skuSkipConfigure = false, skuSkipValidatePeerDeps = false } =
    JSON.parse(fs.readFileSync(packageJson, 'utf-8'));
  skipConfigure = skuSkipConfigure;
  skipValidatePeerDeps = skuSkipValidatePeerDeps;
}

export const configureProject = async () => {
  if (skipConfigure) {
    log(`"skuSkipConfigure" set in ${packageJson}, skipping sku configuration`);
    return;
  }

  const configure = await import('../configure');
  await configure();
};

export const validatePeerDeps = () => {
  if (skipValidatePeerDeps) {
    log(
      `"skuSkipValidatePeerDeps" set in ${packageJson}, skipping sku peer dependency validation`,
    );
    return;
  }

  // Intentionally not awaiting async function as it's just for logging warnings
  _validatePeerDeps();
};
