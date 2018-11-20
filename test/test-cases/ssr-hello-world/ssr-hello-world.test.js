const path = require('path');

const runSkuScriptInDir = require('../../utils/runSkuScriptInDir');
const gracefulSpawn = require('../../../lib/gracefulSpawn');
const waitForUrls = require('../../utils/waitForUrls');
const getAppSnapshot = require('../../utils/getAppSnapshot');
const startAssetServer = require('../../utils/assetServer');
const skuBuildConfig = require('./sku-build.config');
const skuStartConfig = require('./sku-start.config');

const getTestConfig = skuConfig => ({
  backendUrl: `http://localhost:${skuConfig.serverPort}`,
  targetDirectory: path.join(__dirname, skuConfig.target)
});

describe('ssr-hello-world', () => {
  describe('start', () => {
    const { backendUrl } = getTestConfig(skuStartConfig);
    let server;

    beforeAll(async () => {
      server = await runSkuScriptInDir('start-ssr', __dirname, [
        '--config=sku-start.config.js'
      ]);
      await waitForUrls(backendUrl);
    });

    afterAll(() => {
      server.kill();
    });

    it('should start a development server', async () => {
      const snapshot = await getAppSnapshot(backendUrl);
      expect(snapshot).toMatchSnapshot();
    });
  });

  describe('build', () => {
    const { backendUrl, targetDirectory } = getTestConfig(skuBuildConfig);
    let server, closeAssetServer;

    beforeAll(async () => {
      await runSkuScriptInDir('build-ssr', __dirname, [
        '--config=sku-build.config.js'
      ]);

      server = gracefulSpawn('node', ['server'], {
        cwd: targetDirectory,
        stdio: 'inherit'
      });
      closeAssetServer = startAssetServer(4000, targetDirectory);

      await waitForUrls(backendUrl, 'http://localhost:4000');
    });

    afterAll(() => {
      server.kill();
      closeAssetServer();
    });

    it('should generate a production server', async () => {
      const snapshot = await getAppSnapshot(backendUrl);
      expect(snapshot).toMatchSnapshot();
    });
  });
});
