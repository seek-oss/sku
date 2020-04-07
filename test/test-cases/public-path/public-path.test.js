const runSkuScriptInDir = require('../../utils/runSkuScriptInDir');
const { getAppSnapshot } = require('../../utils/appSnapshot');
const waitForUrls = require('../../utils/waitForUrls');

describe('public path', () => {
  describe('build and serve', () => {
    const url = 'http://localhost:4001';
    let process;

    beforeAll(async () => {
      await runSkuScriptInDir('build', __dirname);
      process = await runSkuScriptInDir('serve', __dirname);
      await waitForUrls(url);
    });

    afterAll(async () => {
      await process.kill();
    });

    it('should create valid app with no unresolved resources', async () => {
      const app = await getAppSnapshot(url);
      expect(app).toMatchSnapshot();
    });
  });
});
