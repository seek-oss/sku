const path = require('path');
const waitForUrls = require('../test/utils/waitForUrls');
const runSkuScriptInDir = require('../test/utils/runSkuScriptInDir');
const startAssetServer = require('../test/utils/assetServer');
const gracefulSpawn = require('../lib/gracefulSpawn');

// Actually, it does resolve
// eslint-disable-next-line import/no-unresolved
const skuConfig = require('@fixtures/assertion-removal/sku.config.js');
const appDir = path.dirname(
  require.resolve('@fixtures/assertion-removal/sku.config.js'),
);
const distDir = path.resolve(appDir, 'dist');

const backendUrl = `http://localhost:${skuConfig.serverPort}`;

describe('assertion-removal', () => {
  describe('build', () => {
    const url = 'http://localhost:8239';
    let process;

    beforeAll(async () => {
      await runSkuScriptInDir('build', appDir);
      process = await runSkuScriptInDir('serve', appDir);
      await waitForUrls(url);
    });

    afterAll(async () => {
      await process.kill();
    });

    it('should not contain "assert" in production', async () => {
      const page = await browser.newPage();
      const response = await page.goto(url, { waitUntil: 'networkidle0' });
      const sourceHtml = await response.text();
      expect(sourceHtml).toContain(
        'It rendered without throwing an assertion error',
      );
    });
  });

  describe('build-ssr', () => {
    let server, closeAssetServer;

    beforeAll(async () => {
      await runSkuScriptInDir('build-ssr', appDir);
      server = gracefulSpawn('node', ['server'], {
        cwd: distDir,
        stdio: 'inherit',
      });
      closeAssetServer = await startAssetServer(4003, distDir);
      await waitForUrls(backendUrl, 'http://localhost:4003');
    });

    afterAll(async () => {
      await server.kill();
      closeAssetServer();
    });

    it('should not contain "assert" in production', async function () {
      const page = await browser.newPage();
      const response = await page.goto(backendUrl, {
        waitUntil: 'networkidle0',
      });
      const sourceHtml = await response.text();
      expect(sourceHtml).toContain(
        'It rendered without throwing an assertion error',
      );
    });
  });

  describe('test', () => {
    let exitCode;

    beforeAll(async () => {
      const { childProcess } = await runSkuScriptInDir('test', appDir);
      exitCode = childProcess.exitCode;
    });

    it('should keep "assert" in tests', async () => {
      // App.test.tsx expects the code to throw, which means that the sku test script passes
      expect(exitCode).toEqual(0);
    });
  });
});
