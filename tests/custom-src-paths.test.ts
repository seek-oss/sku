import path from 'node:path';
import {
  dirContentsToObject,
  runSkuScriptInDir,
  waitForUrls,
  getAppSnapshot,
} from '@sku-private/test-utils';

import skuConfigImport from '@sku-fixtures/custom-src-paths/sku.config.ts';
import type { ChildProcess } from 'node:child_process';

import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const appDir = path.dirname(
  require.resolve('@sku-fixtures/custom-src-paths/sku.config.ts'),
);

// TODO: fix this casting.
const skuConfig = skuConfigImport as unknown as typeof skuConfigImport.default;

const targetDirectory = `${appDir}/dist`;
const url = `http://localhost:${skuConfig.port}`;

describe('custom-src-paths', () => {
  describe.each(['vite', 'webpack'])('bundler %s', (bundler) => {
    const args =
      bundler === 'vite'
        ? ['--experimental-bundler', '--config', 'sku.config.vite.ts']
        : [];
    describe('start', () => {
      let process: ChildProcess;

      beforeAll(async () => {
        process = await runSkuScriptInDir('start', appDir, args);
        await waitForUrls(url);
      });

      afterAll(async () => {
        await process.kill();
      });

      it('should start a development server', async () => {
        const snapshot = await getAppSnapshot(url);
        expect(snapshot).toMatchSnapshot();
      });
    });

    describe('build', () => {
      let process: ChildProcess;

      beforeAll(async () => {
        await runSkuScriptInDir('build', appDir, args);
        process = await runSkuScriptInDir('serve', appDir);
        await waitForUrls(url);
      });

      afterAll(async () => {
        await process.kill();
      });

      it('should generate the expected files', async () => {
        const files = await dirContentsToObject(targetDirectory);
        expect(files).toMatchSnapshot();
      });

      it('should create valid app', async () => {
        const app = await getAppSnapshot(url);
        expect(app).toMatchSnapshot();
      });
    });
  });

  describe('format', () => {
    it('should format successfully', async () => {
      const { child } = await runSkuScriptInDir('format', appDir);
      expect(child.exitCode).toEqual(0);
    });
  });

  describe('lint', () => {
    it('should lint successfully', async () => {
      const { child } = await runSkuScriptInDir('lint', appDir);
      expect(child.exitCode).toEqual(0);
    });
  });
});
