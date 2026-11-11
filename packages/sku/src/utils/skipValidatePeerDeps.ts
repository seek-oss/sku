import fs from 'node:fs';
import path from 'node:path';

import { cwd } from '@sku-private/utils';
import { createDebug } from 'obug';

const debug = createDebug('sku:skip-validate-peer-deps');

/**
 * Whether the app has opted out of duplicate-package validation via
 * `skuSkipValidatePeerDeps` in its `package.json`.
 */
export const shouldSkipValidatePeerDeps = (
  rootDir: string = cwd(),
): boolean => {
  try {
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(rootDir, 'package.json'), 'utf-8'),
    );
    return packageJson.skuSkipValidatePeerDeps === true;
  } catch (e) {
    debug('Could not read skuSkipValidatePeerDeps from package.json', e);
    return false;
  }
};
