import { describe, beforeAll, afterAll, it } from 'vitest';
import assert from 'node:assert/strict';
import path from 'node:path';
import {
  waitForUrls,
  runSkuScriptInDir,
  startAssetServer,
  gracefulSpawn,
} from '@sku-private/test-utils';

import skuConfigImport from '@sku-fixtures/assertion-removal/sku.config.ts';
import type { ChildProcess } from 'node:child_process';

import { createRequire } from 'node:module';

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
    let process: ChildProcess;

    beforeAll(async () => {
      await runSkuScriptInDir('build', appDir);
      process = await runSkuScriptInDir('serve', appDir);
      await waitForUrls(url);
    });

    afterAll(async () => {
      await process.kill();
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
    let server: ChildProcess;
    let closeAssetServer: () => void;

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
    let exitCode: number | null;

    beforeAll(async () => {
      const { child } = await runSkuScriptInDir('test', appDir);
      exitCode = child.exitCode;
    });

    it('should keep "assert" and "invariant" in tests', async ({ expect }) => {
      // App.test.tsx expects the code to throw, which means that the sku test script passes
      expect(exitCode).toEqual(0);
    });
  });
});
