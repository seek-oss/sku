import { describe, beforeAll, afterAll, it } from 'vitest';
import path from 'node:path';
import {
  dirContentsToObject,
  getPort,
  runSkuScriptInDir,
  waitForUrls,
} from '@sku-private/test-utils';

import { getAppSnapshot } from '@sku-private/vitest-utils';

import type { ChildProcess } from 'node:child_process';

import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const appDir = path.dirname(
  require.resolve('@sku-fixtures/custom-src-paths/sku.config.ts'),
);

const targetDirectory = `${appDir}/dist`;

describe('custom-src-paths', () => {
  describe.sequential.for(['vite', 'webpack'])('bundler %s', (bundler) => {
    describe('start', async () => {
      let process: ChildProcess;

      const port = await getPort();
      const url = `http://localhost:${port}`;
      const args = ['--strict-port', `--port=${port}`];

      if (bundler === 'vite') {
        args.push('--experimental-bundler', '--config', 'sku.config.vite.ts');
      }

      beforeAll(async () => {
        process = await runSkuScriptInDir('start', appDir, args);
        await waitForUrls(url);
      });

      afterAll(async () => {
        await process.kill();
      });

      it('should start a development server', async ({ expect }) => {
        const snapshot = await getAppSnapshot({ url, expect });
        expect(snapshot).toMatchSnapshot();
      });
    });

    describe('build', async () => {
      let process: ChildProcess;

      const port = await getPort();
      const url = `http://localhost:${port}`;
      const portArgs = ['--strict-port', `--port=${port}`];
      const args: string[] = [];

      if (bundler === 'vite') {
        args.push('--experimental-bundler', '--config', 'sku.config.vite.ts');
      }

      beforeAll(async () => {
        await runSkuScriptInDir('build', appDir, args);
        process = await runSkuScriptInDir('serve', appDir, portArgs);
        await waitForUrls(url);
      });

      afterAll(async () => {
        await process.kill();
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
      const { child } = await runSkuScriptInDir('format', appDir);
      expect(child.exitCode).toEqual(0);
    });
  });

  describe('lint', () => {
    it('should lint successfully', async ({ expect }) => {
      const { child } = await runSkuScriptInDir('lint', appDir);
      expect(child.exitCode).toEqual(0);
    });
  });
});
