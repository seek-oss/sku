const path = require('path');
const dirContentsToObject = require('../test/utils/dirContentsToObject');
const waitForUrls = require('../test/utils/waitForUrls');
const runSkuScriptInDir = require('../test/utils/runSkuScriptInDir');
const { getAppSnapshot } = require('../test/utils/appSnapshot');
const appDir = path.dirname(
  require.resolve('@fixtures/library-build/sku.config.js'),
);
const distDir = path.resolve(appDir, 'dist');

describe('library-build', () => {
  describe('build', () => {
    beforeAll(async () => {
      await runSkuScriptInDir('build', appDir);
    });

    it('should generate the expected files', async () => {
      const files = await dirContentsToObject(distDir);
      expect(files).toMatchSnapshot();
    });
  });

  describe('start', () => {
    const devServerUrl = `http://localhost:8085`;
    let server;

    beforeAll(async () => {
      server = await runSkuScriptInDir('start', appDir);
      await waitForUrls(devServerUrl);
    });

    afterAll(async () => {
      await server.kill();
    });

    it('should start a development server', async () => {
      const snapshot = await getAppSnapshot(devServerUrl);
      expect(snapshot).toMatchSnapshot();
    });
  });
});
