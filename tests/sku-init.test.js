const path = require('node:path');
const fs = require('node:fs');
const { rimraf } = require('rimraf');
const { runSkuScriptInDir } = require('@sku-private/test-utils');

const fixtureDirectory = path.join(__dirname, '../fixtures/sku-init');

describe('sku init', () => {
  it(
    'should create a sku.config.ts',
    async () => {
      const projectName = 'new-project';
      await rimraf(path.join(fixtureDirectory, projectName));

      const { child } = await runSkuScriptInDir('init', fixtureDirectory, [
        projectName,
      ]);

      expect(child.exitCode).toBe(0);

      const skuConfig = fs.readFileSync(
        path.join(fixtureDirectory, projectName, 'sku.config.ts'),
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
    5 * 60 * 1000,
  );
});
