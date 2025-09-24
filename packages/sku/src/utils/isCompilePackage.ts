import { getPathFromCwd } from '@sku-lib/utils';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const isCompilePackage = () => {
  try {
    return Boolean(require(getPathFromCwd('package.json')).skuCompilePackage);
  } catch {
    // Assume false if no package.json
    return false;
  }
};

export default isCompilePackage();
