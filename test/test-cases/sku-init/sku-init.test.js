const rmfr = require('rmfr');
const path = require('path');
const spawnSkuScriptInDir = require('../../utils/spawnSkuScriptInDir');

describe.skip('sku init', () => {
  it(
    'should create a sku.config.js',
    async () => {
      const projectName = 'new-project';
      await rmfr(path.join(__dirname, projectName));

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
          "orderImports": true,
          "publicPath": "/path/to/public/assets/",
          "renderEntry": "src/render.tsx",
          "sites": Array [
            Object {
              "host": "dev.apac.com",
              "name": "apac",
            },
          ],
        }
        `);
    },
    // `sku init` is a long running task and can take some time to complete
    200 * 1000,
  );
});
