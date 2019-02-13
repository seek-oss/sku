const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const readFile = promisify(fs.readFile);

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
    let closeAssetServer;

    beforeAll(async () => {
      await runSkuScriptInDir('build-ssr', __dirname, [
        '--config=sku-build.config.js'
      ]);

      closeAssetServer = await startAssetServer(4000, targetDirectory);
    });

    afterAll(() => {
      closeAssetServer();
    });

    describe('default port', () => {
      let server;

      beforeAll(async () => {
        server = gracefulSpawn('node', ['server'], {
          cwd: targetDirectory,
          stdio: 'inherit'
        });
        await waitForUrls(backendUrl);
      });

      afterAll(() => {
        server.kill();
      });

      it('should generate a production server based on config', async () => {
        const snapshot = await getAppSnapshot(backendUrl);
        expect(snapshot).toMatchSnapshot();
      });

      it("should invoke the provided 'onStart' callback", async () => {
        const pathToFile = path.join(targetDirectory, 'started.txt');
        const startedFile = await readFile(pathToFile, { encoding: 'utf-8' });

        expect(startedFile).toMatchInlineSnapshot(
          `"Server started, here's your callback"`
        );
      });
    });

    describe('custom port', () => {
      const customPort = 7654;
      const customPortUrl = `http://localhost:${customPort}`;
      let server;

      beforeAll(async () => {
        server = gracefulSpawn('node', ['server', '--port', customPort], {
          cwd: targetDirectory,
          stdio: 'inherit'
        });
        await waitForUrls(customPortUrl);
      });

      afterAll(() => {
        server.kill();
      });

      it('should generate a production server running on custom port', async () => {
        const snapshot = await getAppSnapshot(customPortUrl);
        expect(snapshot).toMatchSnapshot();
      });
    });
  });
});
