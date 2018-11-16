const dirContentsToObject = require('../../utils/dirContentsToObject');
const runSkuScriptInDir = require('../../utils/runSkuScriptInDir');
const waitForUrls = require('../../utils/waitForUrls');
const getAppSnapshot = require('../../utils/getAppSnapshot');
const startAssetServer = require('../../utils/assetServer');
const skuConfig = require('./sku.config');

const targetDirectory = `${__dirname}/dist`;

describe('custom-src-paths', () => {
  describe('start', () => {
    const devServerUrl = `http://localhost:${skuConfig.port}`;
    let server;

    beforeAll(async () => {
      server = await runSkuScriptInDir('start', __dirname);
      await waitForUrls(devServerUrl);
    });

    afterAll(() => {
      server.kill();
    });

    it('should start a development server', async () => {
      const snapshot = await getAppSnapshot(devServerUrl);
      expect(snapshot).toMatchSnapshot();
    });
  });

  describe('build', () => {
    let closeAssetServer;

    beforeAll(async () => {
      await runSkuScriptInDir('build', __dirname);
      closeAssetServer = startAssetServer(4000, targetDirectory);
      await waitForUrls('http://localhost:4000');
    });

    afterAll(() => {
      closeAssetServer();
    });

    it('should generate the expected files', async () => {
      const files = await dirContentsToObject(targetDirectory);
      expect(files).toMatchSnapshot();
    });

    it('should create valid app', async () => {
      const app = await getAppSnapshot('http://localhost:4000/production/au');
      expect(app).toMatchSnapshot();
    });
  });

  describe('format', () => {
    it('should format successfully', async () => {
      const {
        childProcess: { exitCode }
      } = await runSkuScriptInDir('format', __dirname);
      expect(exitCode).toEqual(0);
    });
  });

  describe('lint', () => {
    it('should lint successfully', async () => {
      const {
        childProcess: { exitCode }
      } = await runSkuScriptInDir('lint', __dirname);
      expect(exitCode).toEqual(0);
    });
  });
});
