const path = require('path');
const fs = require('fs/promises');

const {
  runSkuScriptInDir,
  waitForUrls,
  getAppSnapshot,
  startAssetServer,
} = require('@sku-private/test-utils');
const gracefulSpawn = require('../lib/gracefulSpawn');

const skuBuildConfig = require('@sku-fixtures/ssr-hello-world/sku-build.config.js');
const skuStartConfig = require('@sku-fixtures/ssr-hello-world/sku-start.config.js');

const appDir = path.dirname(
  require.resolve('@sku-fixtures/ssr-hello-world/sku-build.config.js'),
);

const getTestConfig = (skuConfig) => ({
  backendUrl: `http://localhost:${skuConfig.serverPort}`,
  targetDirectory: path.join(appDir, skuConfig.target),
});

describe('ssr-hello-world', () => {
  describe('start', () => {
    const { backendUrl } = getTestConfig(skuStartConfig);
    let server;

    beforeAll(async () => {
      server = await runSkuScriptInDir('start-ssr', appDir, [
        '--config=sku-start.config.js',
      ]);
      await waitForUrls(backendUrl);
    });

    afterAll(async () => {
      await server.kill();
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
      await runSkuScriptInDir('build-ssr', appDir, [
        '--config=sku-build.config.js',
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
          stdio: 'inherit',
        });
        await waitForUrls(backendUrl);
      });

      afterAll(async () => {
        await server.kill();
      });

      it('should generate a production server based on config', async () => {
        const snapshot = await getAppSnapshot(backendUrl);
        expect(snapshot).toMatchSnapshot();
      });

      it("should invoke the provided 'onStart' callback", async () => {
        const pathToFile = path.join(targetDirectory, 'started.txt');
        const startedFile = await fs.readFile(pathToFile, {
          encoding: 'utf-8',
        });

        expect(startedFile).toMatchInlineSnapshot(
          `"Server started, here's your callback"`,
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
          stdio: 'inherit',
        });
        await waitForUrls(customPortUrl);
      });

      afterAll(async () => {
        await server.kill();
      });

      it('should generate a production server running on custom port', async () => {
        const snapshot = await getAppSnapshot(customPortUrl);
        expect(snapshot).toMatchSnapshot();
      });
    });
  });
});
