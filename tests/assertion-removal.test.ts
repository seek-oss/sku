import { describe, beforeAll, afterAll, it } from 'vitest';
import assert from 'node:assert/strict';
import path from 'node:path';
import {
  waitForUrls,
  runSkuScriptInDir,
  startAssetServer,
  run,
} from '@sku-private/test-utils';

import skuConfigImport from '@sku-fixtures/assertion-removal/sku.config.ts';

import { createRequire } from 'node:module';
import { createCancelSignal } from '@sku-private/test-utils/process.ts';

const require = createRequire(import.meta.url);

const appDir = path.dirname(
  require.resolve('@sku-fixtures/assertion-removal/sku.config.ts'),
);
const distDir = path.resolve(appDir, 'dist');
// TODO: fix this casting.
const skuConfig = skuConfigImport as unknown as typeof skuConfigImport.default;

assert(skuConfig.serverPort, 'skuConfig has serverPort');
const backendUrl = `http://localhost:${skuConfig.serverPort}`;

describe('assertion-removal', () => {
  describe('build', () => {
    const url = 'http://localhost:8239';
    const { cancel, signal } = createCancelSignal();

    beforeAll(async () => {
      await runSkuScriptInDir('build', appDir);
      runSkuScriptInDir('serve', appDir, [], {
        cancelSignal: signal,
      });
      await waitForUrls(url);
    });

    afterAll(async () => {
      cancel();
    });

    it('should not contain "assert" or "invariant" in production', async ({
      expect,
    }) => {
      const appPage = await browser.newPage();
      const response = await appPage.goto(url, { waitUntil: 'networkidle0' });
      const sourceHtml = await response?.text();
      await appPage.close();
      expect(sourceHtml).toContain(
        'It rendered without throwing an assertion error',
      );
    });
  });

  describe('build-ssr', () => {
    const { cancel, signal } = createCancelSignal();
    let closeAssetServer: () => void;

    beforeAll(async () => {
      await runSkuScriptInDir('build-ssr', appDir);
      run('node', ['server'], {
        cwd: distDir,
        stdio: 'inherit',
        cancelSignal: signal,
      });
      closeAssetServer = await startAssetServer(4004, distDir);
      await waitForUrls(backendUrl, 'http://localhost:4004');
    });

    afterAll(async () => {
      cancel();
      closeAssetServer();
    });

    it('should not contain "assert" or "invariant" in production', async function ({
      expect,
    }) {
      const appPage = await browser.newPage();
      const response = await appPage.goto(backendUrl, {
        waitUntil: 'networkidle0',
      });
      const sourceHtml = await response?.text();
      expect(sourceHtml).toContain(
        'It rendered without throwing an assertion error',
      );
    });
  });

  describe('test', () => {
    it('should keep "assert" and "invariant" in tests', async ({ expect }) => {
      const child = await runSkuScriptInDir('test', appDir);
      // App.test.tsx expects the code to throw, which means that the sku test script passes
      expect(child?.exitCode).toEqual(0);
    });
  });
});
