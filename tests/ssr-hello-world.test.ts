import { describe, beforeAll, afterAll, it } from 'vitest';
import { getAppSnapshot } from '@sku-private/puppeteer';
import path from 'node:path';
import fs from 'node:fs/promises';

import {
  runSkuScriptInDir,
  waitForUrls,
  startAssetServer,
} from '@sku-private/test-utils';

import skuBuildConfig from '@sku-fixtures/ssr-hello-world/sku-build.config.ts';
import skuStartConfig from '@sku-fixtures/ssr-hello-world/sku-start.config.ts';

import { createRequire } from 'node:module';
import { createCancelSignal, run } from '@sku-private/test-utils/process.ts';

const require = createRequire(import.meta.url);

const appDir = path.dirname(
  require.resolve('@sku-fixtures/ssr-hello-world/sku-build.config.ts'),
);

const getTestConfig = (skuConfig: { serverPort: number; target: string }) => ({
  backendUrl: `http://localhost:${skuConfig.serverPort}`,
  targetDirectory: path.join(appDir, skuConfig.target),
});

describe('ssr-hello-world', () => {
  describe('start', () => {
    const { backendUrl } = getTestConfig(skuStartConfig);
    const { cancel, signal } = createCancelSignal();

    beforeAll(async () => {
      runSkuScriptInDir('start-ssr', appDir, {
        signal,
        args: ['--config=sku-start.config.ts'],
      });
      await waitForUrls(backendUrl);
    });

    afterAll(async () => {
      cancel();
    });

    it('should start a development server', async ({ expect }) => {
      const snapshot = await getAppSnapshot({ url: backendUrl, expect });
      expect(snapshot).toMatchSnapshot();
    });

    it('should respond to dev middleware route request', async ({ expect }) => {
      const { sourceHtml } = await getAppSnapshot({
        url: `${backendUrl}/test-middleware`,
        expect,
      });
      expect(sourceHtml).toBe('OK');
    });

    it('should respond to dev middleware static asset request', async ({
      expect,
    }) => {
      const { sourceHtml } = await getAppSnapshot({
        url: `${backendUrl}/assets/logo.png`,
        expect,
      });
      expect(sourceHtml).toMatch(/^�PNG/);
    });
  });

  describe('build', () => {
    const { backendUrl, targetDirectory } = getTestConfig(skuBuildConfig);
    let closeAssetServer: () => void;

    beforeAll(async () => {
      await runSkuScriptInDir('build-ssr', appDir, {
        args: ['--config=sku-build.config.ts'],
      });

      closeAssetServer = await startAssetServer(4000, targetDirectory);
    });

    afterAll(() => {
      closeAssetServer();
    });

    describe('default port', () => {
      const { cancel, signal } = createCancelSignal();

      beforeAll(async () => {
        run('node', {
          args: ['server.cjs'],
          cwd: targetDirectory,
          stdio: 'inherit',
          signal,
        });
        await waitForUrls(backendUrl);
      });

      afterAll(async () => {
        cancel();
      });

      it('should generate a production server based on config', async ({
        expect,
      }) => {
        const snapshot = await getAppSnapshot({ url: backendUrl, expect });
        expect(snapshot).toMatchSnapshot();
      });

      it("should invoke the provided 'onStart' callback", async ({
        expect,
      }) => {
        const pathToFile = path.join(targetDirectory, 'started.txt');
        const startedFile = await fs.readFile(pathToFile, {
          encoding: 'utf-8',
        });

        expect(startedFile).toMatchInlineSnapshot(
          `"Server started, here's your callback"`,
        );
      });
    });

    describe('custom port', () => {
      const customPort = '7654';
      const customPortUrl = `http://localhost:${customPort}`;
      const { cancel, signal } = createCancelSignal();

      beforeAll(async () => {
        run('node', {
          args: ['server.cjs', '--port', customPort],
          cwd: targetDirectory,
          stdio: 'inherit',
          signal,
        });
        await waitForUrls(customPortUrl);
      });

      afterAll(async () => {
        cancel();
      });

      it('should generate a production server running on custom port', async ({
        expect,
      }) => {
        const snapshot = await getAppSnapshot({ url: customPortUrl, expect });
        expect(snapshot).toMatchSnapshot();
      });
    });

    it('should copy all public assets to the target folder', async ({
      expect,
    }) => {
      const files = await fs.readdir(path.join(appDir, 'dist-build'));
      expect(files).toContain('logo.png');
      expect(files).toContain('logo2.png');
      expect(files).toContain('foo');

      const fooFiles = await fs.readdir(path.join(appDir, 'dist-build/foo'));
      expect(fooFiles).toContain('logo.png');
      expect(fooFiles).toContain('bar');

      const barFiles = await fs.readdir(
        path.join(appDir, 'dist-build/foo/bar'),
      );
      expect(barFiles).toContain('logo.png');
    });
  });
});
