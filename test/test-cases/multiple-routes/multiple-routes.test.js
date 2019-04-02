const path = require('path');
const dirContentsToObject = require('../../utils/dirContentsToObject');
const runSkuScriptInDir = require('../../utils/runSkuScriptInDir');
const waitForUrls = require('../../utils/waitForUrls');
const { getAppSnapshot } = require('../../utils/appSnapshot');
const startAssetServer = require('../../utils/assetServer');
const appDir = path.resolve(__dirname, 'app');

const targetDirectory = `${appDir}/dist`;

describe('multiple-routes', () => {
  describe('start', () => {
    const devServerUrl = `http://localhost:8202`;
    let server;

    beforeAll(async () => {
      server = await runSkuScriptInDir('start', appDir);
      await waitForUrls(devServerUrl);
    });

    afterAll(() => {
      server.kill();
    });

    it('should render home page correctly', async () => {
      const snapshot = await getAppSnapshot(devServerUrl);
      expect(snapshot).toMatchSnapshot();
    });

    it('should render details page correctly', async () => {
      const snapshot = await getAppSnapshot(`${devServerUrl}/details/123`);
      expect(snapshot).toMatchSnapshot();
    });
  });

  describe('test', () => {
    it('should handle dynamic imports in tests', async () => {
      const { childProcess } = await runSkuScriptInDir('test', appDir);
      expect(childProcess.exitCode).toEqual(0);
    });
  });

  describe('build', () => {
    let closeAssetServer;

    beforeAll(async () => {
      await runSkuScriptInDir('build', appDir);
      closeAssetServer = await startAssetServer(4004, targetDirectory, [
        { source: '/', destination: '/production/au/index.html' },
      ]);
    });

    afterAll(() => {
      closeAssetServer();
    });

    it('should create valid app', async () => {
      const app = await getAppSnapshot('http://localhost:4004');
      expect(app).toMatchSnapshot();
    });

    it('should generate the expected files', async () => {
      const files = await dirContentsToObject(targetDirectory);
      expect(files).toMatchSnapshot();
    });
  });
});
