const dirContentsToObject = require('../../utils/dirContentsToObject');
const runSkuScriptInDir = require('../../utils/runSkuScriptInDir');
const waitForUrls = require('../../utils/waitForUrls');
const { getAppSnapshot } = require('../../utils/appSnapshot');
const startAssetServer = require('../../utils/assetServer');

const targetDirectory = `${__dirname}/dist`;

describe('multiple-routes', () => {
  describe('start', () => {
    const devServerUrl = `http://localhost:8202`;
    let server;

    beforeAll(async () => {
      server = await runSkuScriptInDir('start', __dirname);
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

  describe('build', () => {
    let closeAssetServer;

    beforeAll(async () => {
      await runSkuScriptInDir('build', __dirname);
      closeAssetServer = await startAssetServer(4004, targetDirectory, [
        { source: '/', destination: '/production/au/index.html' }
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
