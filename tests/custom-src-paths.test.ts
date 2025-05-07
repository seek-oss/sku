import { describe, beforeAll, afterAll, it } from 'vitest';
import path from 'node:path';
import {
  dirContentsToObject,
  getPort,
  runSkuScriptInDir,
  waitForUrls,
  createCancelSignal,
} from '@sku-private/test-utils';

import { getAppSnapshot } from '@sku-private/vitest-utils';

import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const appDir = path.dirname(
  require.resolve('@sku-fixtures/custom-src-paths/sku.config.ts'),
);

const targetDirectory = `${appDir}/dist`;

describe('custom-src-paths', () => {
  describe.sequential.for(['vite', 'webpack'])('bundler %s', (bundler) => {
    describe('start', async () => {
      const { cancel, signal } = createCancelSignal();

      const port = await getPort();
      const url = `http://localhost:${port}`;
      const args = ['--strict-port', `--port=${port}`];

      if (bundler === 'vite') {
        args.push('--experimental-bundler', '--config', 'sku.config.vite.ts');
      }

      beforeAll(async () => {
        runSkuScriptInDir('start', appDir, { args, signal });
        await waitForUrls(url);
      });

      afterAll(async () => {
        cancel();
      });

      it('should start a development server', async ({ expect }) => {
        const snapshot = await getAppSnapshot({ url, expect });
        expect(snapshot).toMatchSnapshot();
      });
    });

    describe('build', async () => {
      const { cancel, signal } = createCancelSignal();

      const port = await getPort();
      const url = `http://localhost:${port}`;
      const portArgs = ['--strict-port', `--port=${port}`];
      const args: string[] = [];

      if (bundler === 'vite') {
        args.push('--experimental-bundler', '--config', 'sku.config.vite.ts');
      }

      beforeAll(async () => {
        await runSkuScriptInDir('build', appDir, { args });
        runSkuScriptInDir('serve', appDir, { args: portArgs, signal });
        await waitForUrls(url);
      });

      afterAll(async () => {
        cancel();
      });

      it('should generate the expected files', async ({ expect }) => {
        const files = await dirContentsToObject(targetDirectory);
        expect(files).toMatchSnapshot();
      });

      it('should create valid app', async ({ expect }) => {
        const app = await getAppSnapshot({ expect, url });
        expect(app).toMatchSnapshot();
      });
    });
  });

  describe('format', () => {
    it('should format successfully', async ({ expect }) => {
      await expect(
        runSkuScriptInDir('format', appDir),
      ).resolves.not.toThrowError();
    });
  });

  describe('lint', () => {
    it('should lint successfully', async ({ expect }) => {
      await expect(
        runSkuScriptInDir('lint', appDir),
      ).resolves.not.toThrowError();
    });
  });
});
