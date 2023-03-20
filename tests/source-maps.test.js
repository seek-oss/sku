const path = require('path');

const {
  runSkuScriptInDir,
  dirContentsToObject,
} = require('@sku-private/test-utils');

const appDir = path.dirname(
  require.resolve('@sku-fixtures/source-maps/sku.config.js'),
);

describe('source-maps', () => {
  describe('build', () => {
    beforeAll(async () => {
      await runSkuScriptInDir('build', appDir);
    });

    it('should generate the expected files', async () => {
      const files = await dirContentsToObject(`${appDir}/dist`);
      expect(files).toMatchSnapshot();
    });
  });
});
