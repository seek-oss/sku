import assert from 'assert';
import path from 'path';
import {
  waitForUrls,
  runSkuScriptInDir,
  startAssetServer,
} from '@sku-private/test-utils';
import gracefulSpawn from '../packages/sku/lib/gracefulSpawn';

import skuConfig from '@sku-fixtures/assertion-removal/sku.config.ts';
const appDir = path.dirname(
  require.resolve('@sku-fixtures/assertion-removal/sku.config.ts'),
);
const distDir = path.resolve(appDir, 'dist');

assert(skuConfig.serverPort, 'skuConfig has serverPort');
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
      closeAssetServer = await startAssetServer(4004, distDir);
      await waitForUrls(backendUrl, 'http://localhost:4004');
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
      const { child } = await runSkuScriptInDir('test', appDir);
      exitCode = child.exitCode;
    });

    it('should keep "assert" in tests', async () => {
      // App.test.tsx expects the code to throw, which means that the sku test script passes
      expect(exitCode).toEqual(0);
    });
  });
});
