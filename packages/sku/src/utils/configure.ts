import { getPathFromCwd } from '@sku-private/utils';

import fs from 'node:fs';
import { log } from './debug.js';
import type { SkuContext } from '../context/createSkuContext.js';

let skipConfigure = false;
const packageJson = getPathFromCwd('./package.json');
const packageJsonExists = fs.existsSync(packageJson);

if (packageJsonExists) {
  const { skuSkipConfigure = false } = JSON.parse(
    fs.readFileSync(packageJson, 'utf-8'),
  );
  skipConfigure = skuSkipConfigure;
}

export const configureProject = async (skuContext: SkuContext) => {
  if (skipConfigure) {
    log(`"skuSkipConfigure" set in ${packageJson}, skipping sku configuration`);
    return;
  }

  const { default: configure } = await import('../utils/configureApp.js');
  await configure(skuContext);
};
