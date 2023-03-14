const path = require('path');
const dirContentsToObject = require('../test/utils/dirContentsToObject');
const runSkuScriptInDir = require('../test/utils/runSkuScriptInDir');
const waitForUrls = require('../test/utils/waitForUrls');
const { getAppSnapshot } = require('../test/utils/appSnapshot');
const skuConfig = require('@fixtures/custom-src-paths/sku.config.js');
const appDir = path.dirname(
  require.resolve('@fixtures/custom-src-paths/sku.config.js'),
);

const targetDirectory = `${appDir}/dist`;
const url = `http://localhost:${skuConfig.port}`;

describe('custom-src-paths', () => {
  describe('start', () => {
    let process;

    beforeAll(async () => {
      process = await runSkuScriptInDir('start', appDir);
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
      await runSkuScriptInDir('build', appDir);
      process = await runSkuScriptInDir('serve', appDir);
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
      } = await runSkuScriptInDir('format', appDir);
      expect(exitCode).toEqual(0);
    });
  });

  describe('lint', () => {
    it('should lint successfully', async () => {
      const {
        childProcess: { exitCode },
      } = await runSkuScriptInDir('lint', appDir);
      expect(exitCode).toEqual(0);
    });
  });
});