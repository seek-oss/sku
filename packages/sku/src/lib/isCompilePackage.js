// @ts-check
import { getPathFromCwd } from './cwd.js';

const isCompilePackage = () => {
  try {
    return Boolean(require(getPathFromCwd('package.json')).skuCompilePackage);
  } catch {
    // Assume false if no package.json
    return false;
  }
};

export default isCompilePackage();