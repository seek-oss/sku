const path = require('path');
const dirContentsToObject = require('../test/utils/dirContentsToObject');
const runSkuScriptInDir = require('../test/utils/runSkuScriptInDir');
const waitForUrls = require('../test/utils/waitForUrls');
const { getAppSnapshot } = require('../test/utils/appSnapshot');
const appDir = path.dirname(
  require.resolve('@sku-fixtures/multiple-routes/sku.config.js'),
);

const targetDirectory = `${appDir}/dist`;
const url = `http://localhost:8202`;

describe('multiple-routes', () => {
  describe('start', () => {
    let process;

    beforeAll(async () => {
      process = await runSkuScriptInDir('start', appDir);
      await waitForUrls(url);
    });

    afterAll(async () => {
      await process.kill();
    });

    it('should render home page correctly', async () => {
      const snapshot = await getAppSnapshot(url);
      expect(snapshot).toMatchSnapshot();
    });

    it('should render details page correctly', async () => {
      const snapshot = await getAppSnapshot(`${url}/details/123`);
      expect(snapshot).toMatchSnapshot();
    });
  });

  describe('test', () => {
    it('should handle dynamic imports in tests', async () => {
      const { childProcess } = await runSkuScriptInDir('test', appDir);
      expect(childProcess.exitCode).toEqual(0);
    });
  });

  describe('build and serve', () => {
    let process;

    beforeAll(async () => {
      await runSkuScriptInDir('build', appDir);
      process = await runSkuScriptInDir('serve', appDir);
      await waitForUrls(url);
    });

    afterAll(async () => {
      await process.kill();
    });

    it('should return home page', async () => {
      const app = await getAppSnapshot(url);
      expect(app).toMatchSnapshot();
    });

    it('should return details page', async () => {
      const app = await getAppSnapshot(`${url}/details/123`);
      expect(app).toMatchSnapshot();
    });

    it('should generate the expected files', async () => {
      const files = await dirContentsToObject(targetDirectory);
      expect(files).toMatchSnapshot();
    });
  });
});
