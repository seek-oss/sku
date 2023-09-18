const path = require('node:path');
const {
  runSkuScriptInDir,
  waitForUrls,
  getAppSnapshot,
} = require('@sku-private/test-utils');

const appDir = path.dirname(
  require.resolve('@sku-fixtures/public-path/sku.config.js'),
);

describe('public path', () => {
  describe('build and serve', () => {
    const url = 'http://localhost:4001';
    let process;

    beforeAll(async () => {
      await runSkuScriptInDir('build', appDir);
      process = await runSkuScriptInDir('serve', appDir);
      await waitForUrls(url);
    });

    afterAll(async () => {
      await process.kill();
    });

    it('should create valid app with no unresolved resources', async () => {
      const app = await getAppSnapshot(url);
      expect(app).toMatchSnapshot();
    });
  });
});
