import { getPathFromCwd } from '@sku-private/utils';

import fs from 'node:fs';
import { validatePeerDeps as _validatePeerDeps } from './validatePeerDeps.js';
import { log } from './debug.js';
import type { SkuContext } from '../context/createSkuContext.js';

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

export const configureProject = async (skuContext: SkuContext) => {
  if (skipConfigure) {
    log(`"skuSkipConfigure" set in ${packageJson}, skipping sku configuration`);
    return;
  }

  const { default: configure } = await import('../utils/configureApp.js');
  await configure(skuContext);
};

export const validatePeerDeps = (skuContext: SkuContext) => {
  if (skipValidatePeerDeps) {
    log(
      `"skuSkipValidatePeerDeps" set in ${packageJson}, skipping sku peer dependency validation`,
    );
    return;
  }

  // Intentionally not awaiting async function as it's just for logging warnings
  _validatePeerDeps(skuContext);
};
