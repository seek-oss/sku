const path = require('path');

const runSkuScriptInDir = require('../../utils/runSkuScriptInDir');
const gracefulSpawn = require('../../../lib/gracefulSpawn');
const waitForUrls = require('../../utils/waitForUrls');
const getAppSnapshot = require('../../utils/getAppSnapshot');
const { startBin } = require('../../../lib/runBin');
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
    let server, assetServer;

    beforeAll(async () => {
      await runSkuScriptInDir('build-ssr', __dirname);

      server = gracefulSpawn('node', ['server'], {
        cwd: targetDirectory,
        stdio: 'inherit'
      });

      assetServer = startBin({
        packageName: 'serve',
        args: ['-l', 'tcp://localhost:4000'],
        options: { cwd: targetDirectory }
      });

      await waitForUrls(backendUrl, 'http://localhost:4000');
    });

    afterAll(() => {
      server.kill();
      assetServer.kill();
    });

    it('should generate a production server', async () => {
      const snapshot = await getAppSnapshot(backendUrl);
      expect(snapshot).toMatchSnapshot();
    });
  });
});
