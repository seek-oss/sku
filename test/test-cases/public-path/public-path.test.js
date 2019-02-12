const runSkuScriptInDir = require('../../utils/runSkuScriptInDir');
const getAppSnapshot = require('../../utils/getAppSnapshot');
const startAssetServer = require('../../utils/assetServer');
const targetDirectory = `${__dirname}/dist`;

describe('public path', () => {
  describe('build', () => {
    let closeAssetServer;

    beforeAll(async () => {
      await runSkuScriptInDir('build', __dirname);
      closeAssetServer = await startAssetServer(4001, targetDirectory);
    });

    afterAll(() => {
      closeAssetServer();
    });

    it('should create valid app with no unresolved resources', async () => {
      const app = await getAppSnapshot('http://localhost:4001/static');
      expect(app).toMatchSnapshot();
    });
  });
});
