const path = require('path');

const runSkuScriptInDir = require('../../utils/runSkuScriptInDir');
const gracefulSpawn = require('../../../lib/gracefulSpawn');
const waitForUrls = require('../../utils/waitForUrls');
const getAppSnapshot = require('../../utils/getAppSnapshot');
const startAssetServer = require('../../utils/assetServer');
const skuConfig = require('./sku.config');

const backendUrl = `http://localhost:${skuConfig.serverPort}`;

describe('ssr-hello-world', () => {
  describe('start', () => {
    let server;
    beforeAll(async () => {
      server = await runSkuScriptInDir('start-ssr', __dirname);
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
    const targetDirectory = path.join(__dirname, 'dist');
    let server, closeAssetServer;

    beforeAll(async () => {
      await runSkuScriptInDir('build-ssr', __dirname);

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
