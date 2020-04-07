const dirContentsToObject = require('../../utils/dirContentsToObject');
const runSkuScriptInDir = require('../../utils/runSkuScriptInDir');
const waitForUrls = require('../../utils/waitForUrls');
const { getAppSnapshot } = require('../../utils/appSnapshot');
const skuConfig = require('./sku.config');

const targetDirectory = `${__dirname}/dist`;
const url = `http://localhost:${skuConfig.port}`;

describe('custom-src-paths', () => {
  describe('start', () => {
    let process;

    beforeAll(async () => {
      process = await runSkuScriptInDir('start', __dirname);
      await waitForUrls(url);
    });

    afterAll(async () => {
      await process.kill();
    });

    it('should start a development server', async () => {
      const snapshot = await getAppSnapshot(url);
      expect(snapshot).toMatchSnapshot();
    });
  });

  describe('build', () => {
    let process;

    beforeAll(async () => {
      await runSkuScriptInDir('build', __dirname);
      process = await runSkuScriptInDir('serve', __dirname);
      await waitForUrls(url);
    });

    afterAll(async () => {
      await process.kill();
    });

    it('should generate the expected files', async () => {
      const files = await dirContentsToObject(targetDirectory);
      expect(files).toMatchSnapshot();
    });

    it('should create valid app', async () => {
      const app = await getAppSnapshot(url);
      expect(app).toMatchSnapshot();
    });
  });

  describe('format', () => {
    it('should format successfully', async () => {
      const {
        childProcess: { exitCode },
      } = await runSkuScriptInDir('format', __dirname);
      expect(exitCode).toEqual(0);
    });
  });

  describe('lint', () => {
    it('should lint successfully', async () => {
      const {
        childProcess: { exitCode },
      } = await runSkuScriptInDir('lint', __dirname);
      expect(exitCode).toEqual(0);
    });
  });
});
