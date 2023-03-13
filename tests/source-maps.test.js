const path = require('path');

const dirContentsToObject = require('../test/utils/dirContentsToObject');
const runSkuScriptInDir = require('../test/utils/runSkuScriptInDir');

const appDir = path.dirname(
  require.resolve('@fixtures/source-maps/sku.config.js'),
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
