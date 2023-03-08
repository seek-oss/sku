const path = require('path');
const dirContentsToObject = require('../test/utils/dirContentsToObject');
const { getAppSnapshot } = require('../test/utils/appSnapshot');
const waitForUrls = require('../test/utils/waitForUrls');
const startAssetServer = require('../test/utils/assetServer');
const { runBin, startBin } = require('../lib/runBin');

const appDir = path.join(
  __dirname,
  './node_modules/@fixtures/sku-webpack-plugin',
);
const distDir = path.resolve(appDir, 'dist');

const port = 9876;
const devServerUrl = `http://localhost:${port}`;

describe('sku-webpack-plugin', () => {
  describe('start', () => {
    let process;

    beforeAll(async () => {
      process = startBin({
        packageName: 'webpack-dev-server',
        args: ['--mode', 'development'],
        options: {
          cwd: appDir,
        },
      });

      await waitForUrls(devServerUrl);
    }, 150000);

    afterAll(async () => {
      await process.kill();
    });

    it('should start a development server', async () => {
      const snapshot = await getAppSnapshot(devServerUrl);
      expect(snapshot).toMatchSnapshot();
    });
  });

  describe('build', () => {
    let closeAssetServer;

    beforeAll(async () => {
      await runBin({
        packageName: 'webpack-cli',
        args: ['--mode', 'production', '--no-stats'],
        options: {
          cwd: appDir,
          env: {
            ...process.env,
            NODE_ENV: 'production',
          },
        },
      });

      closeAssetServer = await startAssetServer(port, distDir);
    }, 150000);

    afterAll(() => {
      closeAssetServer();
    });

    it('should create valid app', async () => {
      const app = await getAppSnapshot(devServerUrl);
      expect(app).toMatchSnapshot();
    });

    it('should generate the expected files', async () => {
      const files = await dirContentsToObject(distDir);
      expect(files).toMatchSnapshot();
    });
  });
});
