import { describe, beforeAll, afterAll, it } from 'vitest';
import { getAppSnapshot } from '@sku-private/puppeteer';
import assert from 'node:assert/strict';
import path from 'node:path';
import { rm } from 'node:fs/promises';
import {
  dirContentsToObject,
  waitForUrls,
  runSkuScriptInDir,
  startAssetServer,
  getPort,
} from '@sku-private/test-utils';

import skuConfig from '@sku-fixtures/typescript-css-modules/sku.config.ts';
import skuSsrConfig from '@sku-fixtures/typescript-css-modules/sku-ssr.config.ts';

import { createRequire } from 'node:module';
import { createCancelSignal, run } from '@sku-private/test-utils/process.ts';

const require = createRequire(import.meta.url);

const appDir = path.dirname(
  require.resolve('@sku-fixtures/typescript-css-modules/sku.config.ts'),
);
const distDir = path.resolve(appDir, 'dist');
const distSsrDir = path.resolve(appDir, 'dist-ssr');

assert(skuSsrConfig.serverPort, 'sku config has serverPort');

describe.sequential('typescript-css-modules', () => {
  describe('build', async () => {
    assert(skuConfig.port, 'sku config has port');

    const { cancel, signal } = createCancelSignal();
    const port = await getPort();
    const url = `http://localhost:${port}`;
    const args = ['--strict-port', `--port=${port}`];

    beforeAll(async () => {
      await runSkuScriptInDir('build', appDir);
      runSkuScriptInDir('serve', appDir, { args, signal });
      await waitForUrls(url);
    });

    afterAll(async () => {
      cancel();
      // Clean up dist dir to prevent pollution of linted files in lint test
      await rm(distDir, { recursive: true, force: true });
    });

    it('should create valid app', async ({ expect }) => {
      const app = await getAppSnapshot({ url, expect });
      expect(app).toMatchSnapshot();
    });

    it('should generate the expected files', async ({ expect }) => {
      const files = await dirContentsToObject(distDir);
      expect(files).toMatchSnapshot();
    });
  });

  describe('build-ssr', async () => {
    const { cancel, signal } = createCancelSignal();
    let closeAssetServer: () => void;

    const assetServerPort = 4003;
    const backendUrl = `http://localhost:${skuSsrConfig.serverPort}`;

    beforeAll(async () => {
      await runSkuScriptInDir('build-ssr', appDir, {
        args: ['--config=sku-ssr.config.ts'],
      });
      run('node', {
        args: ['server.cjs'],
        cwd: distSsrDir,
        stdio: 'inherit',
        signal,
      });
      closeAssetServer = await startAssetServer(assetServerPort, distSsrDir);
      await waitForUrls(backendUrl, `http://localhost:${assetServerPort}`);
    });

    afterAll(async () => {
      cancel();
      closeAssetServer();
      // Clean up dist-ssr dir to prevent pollution of linted files in lint test
      await rm(distSsrDir, { recursive: true, force: true });
    });

    it('should create valid app', async ({ expect }) => {
      const app = await getAppSnapshot({ url: backendUrl, expect });
      expect(app).toMatchSnapshot();
    });

    it('should generate the expected files', async ({ expect }) => {
      const files = await dirContentsToObject(distSsrDir, [
        '.cjs',
        '.js',
        '.css',
      ]);
      expect(files).toMatchSnapshot();
    });
  });

  describe('start', async () => {
    const { cancel, signal } = createCancelSignal();

    const port = await getPort();
    const devServerUrl = `http://localhost:${port}`;
    const args = ['--strict-port', `--port=${port}`];

    beforeAll(async () => {
      runSkuScriptInDir('start', appDir, { args, signal });
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

  describe('test', () => {
    it('should handle Vanilla Extract styles in tests', async ({ expect }) => {
      await expect(
        runSkuScriptInDir('test', appDir),
      ).resolves.not.toThrowError();
    });
  });

  describe('lint', () => {
    it('should handle tsc and eslint', async ({ expect }) => {
      // run build first to ensure typescript declarations are generated
      await runSkuScriptInDir('build', appDir);
      await expect(
        runSkuScriptInDir('lint', appDir),
      ).resolves.not.toThrowError();
    });
  });
});
