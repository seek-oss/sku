import { describe, beforeAll, afterAll, it } from 'vitest';
import assert from 'node:assert/strict';
import path from 'node:path';
import {
  waitForUrls,
  runSkuScriptInDir,
  startAssetServer,
  run,
  createCancelSignal,
  getPort,
} from '@sku-private/test-utils';

import skuConfigImport from '@sku-fixtures/assertion-removal/sku.config.ts';

import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const appDir = path.dirname(
  require.resolve('@sku-fixtures/assertion-removal/sku.config.ts'),
);
const distDir = path.resolve(appDir, 'dist');
const skuConfig = skuConfigImport;

assert(skuConfig.serverPort, 'skuConfig has serverPort');
const backendUrl = `http://localhost:${skuConfig.serverPort}`;

describe('assertion-removal', () => {
  describe.for(['vite', 'webpack'])('bundler %s', (bundler) => {
    describe('build', async () => {
      const port = await getPort();
      const url = `http://localhost:${port}`;
      const { cancel, signal } = createCancelSignal();
      const args: Record<string, string[]> = {
        vite: ['--config', 'sku.config.vite.ts', '--experimental-bundler'],
      };

      beforeAll(async () => {
        await runSkuScriptInDir('build', appDir, { args: args[bundler] });
        runSkuScriptInDir('serve', appDir, {
          args: ['--strict-port', `--port=${port}`],
          signal,
        });
        await waitForUrls(url);
      });

      afterAll(() => {
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
  });

  describe('build-ssr', () => {
    const { cancel, signal } = createCancelSignal();
    let closeAssetServer: () => void;

    beforeAll(async () => {
      await runSkuScriptInDir('build-ssr', appDir);
      run('node', {
        args: ['server.cjs'],
        cwd: distDir,
        stdio: 'inherit',
        signal,
      });
      closeAssetServer = await startAssetServer(4004, distDir);
      await waitForUrls(backendUrl, 'http://localhost:4004');
    });

    afterAll(() => {
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
      // App.test.tsx expects the code to throw, which means that the sku test script passes
      await expect(
        runSkuScriptInDir('test', appDir),
      ).resolves.not.toThrowError();
    });
  });
});
