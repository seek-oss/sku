import { describe, beforeAll, afterAll, it } from 'vitest';
import { getAppSnapshot } from '@sku-private/puppeteer';
import assert from 'node:assert/strict';
import path from 'node:path';
import {
  waitForUrls,
  runSkuScriptInDir,
  getPort,
  createCancelSignal,
} from '@sku-private/test-utils';
import skuConfig from '@sku-fixtures/polyfills/sku.config.ts';

import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const appDir = path.dirname(
  require.resolve('@sku-fixtures/polyfills/sku.config.ts'),
);

assert(skuConfig.port, 'sku config has port');

describe('polyfills', () => {
  const args: Record<string, string[]> = {
    vite: ['--config', 'sku.config.vite.ts', '--experimental-bundler'],
  };

  describe.sequential.for(['webpack'])('bundler %s', async (bundler) => {
    const port = await getPort();
    const baseUrl = `http://localhost:${port}`;

    describe('build', () => {
      const { cancel, signal } = createCancelSignal();

      beforeAll(async () => {
        await runSkuScriptInDir('build', appDir, { args: args[bundler] });
        runSkuScriptInDir('serve', appDir, {
          args: ['--strict-port', `--port=${port}`],
          signal,
        });
        await waitForUrls(baseUrl);
      });

      afterAll(async () => {
        cancel();
      });

      it('should create valid app', async ({ expect }) => {
        const app = await getAppSnapshot({ url: baseUrl, expect });
        expect(app).toMatchSnapshot();
      });
    });

    describe('start', () => {
      const { cancel, signal } = createCancelSignal();
      const devServerUrl = `http://localhost:${skuConfig.port}`;

      beforeAll(async () => {
        runSkuScriptInDir('start', appDir, {
          signal,
        });
        await waitForUrls(devServerUrl);
      });

      afterAll(async () => {
        cancel();
      });

      it('should start a development server', async ({ expect }) => {
        const snapshot = await getAppSnapshot({ url: devServerUrl, expect });
        expect(snapshot).toMatchSnapshot();
      });
    });
  });
});
