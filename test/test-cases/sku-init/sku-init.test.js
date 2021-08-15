const { promisify } = require('util');
const path = require('path');
const rimraf = promisify(require('rimraf'));
const spawnSkuScriptInDir = require('../../utils/spawnSkuScriptInDir');

describe('sku init', () => {
  it(
    'should create a sku.config.js',
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

      const skuConfig = require(path.join(
        __dirname,
        projectName,
        'sku.config.js',
      ));

      expect(skuConfig).toMatchInlineSnapshot(`
        Object {
          "clientEntry": "src/client.tsx",
          "environments": Array [
            "development",
            "production",
          ],
          "orderImports": true,
          "publicPath": "/path/to/public/assets/",
          "renderEntry": "src/render.tsx",
        }
      `);
    },
    // `sku init` is a long running task and can take some time to complete
    150 * 1000,
  );
});
