import { join } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const modules = ['node_modules'];

try {
  const skuPath = require.resolve('sku/package.json');

  // If the project is using pnpm then we add the sku node_modules directory
  // to the modules array. This allows dependecies of sku to be importable
  // as part of the build process. This is specifically useful for
  // @babel/plugin-transform-runtime as it inject imports to @babel/runtime.
  if (skuPath.includes('.pnpm')) {
    modules.push(join(skuPath, '../..'));
  }
} catch {
  // Ignore errors as if sku isn't resolvable then we don't need to apply the pnpm fix
}

export default modules;
