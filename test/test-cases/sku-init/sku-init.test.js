const { promisify } = require('util');
const path = require('path');
const fs = require('fs');
const rimraf = promisify(require('rimraf'));
const spawnSkuScriptInDir = require('../../utils/spawnSkuScriptInDir');

describe('sku init', () => {
  it(
    'should create a sku.config.ts',
    async () => {
      const projectName = 'new-project';
      await rimraf(path.join(__dirname, projectName));

      const childPromise = spawnSkuScriptInDir('init', __dirname, [
        projectName,
      ]);

      // Should exit with exit code 0
      await expect(childPromise).resolves.toEqual(
        expect.objectContaining({ code: 0 }),
      );

      const skuConfig = fs.readFileSync(
        path.join(__dirname, projectName, 'sku.config.ts'),
        'utf-8',
      );

      expect(skuConfig).toMatchInlineSnapshot(`
"import type { SkuConfig } from 'sku';

const skuConfig: SkuConfig = {
  clientEntry: 'src/client.tsx',
  renderEntry: 'src/render.tsx',
  environments: ['development', 'production'],
  publicPath: '/path/to/public/assets/', // <-- Required for sku build output
  orderImports: true,
};

export default skuConfig;
"
`);
    },
    // `sku init` is a long running task and can take some time to complete
    150 * 1000,
  );
});
