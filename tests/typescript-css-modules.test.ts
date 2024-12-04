import assert from 'node:assert/strict';
import path from 'node:path';
import { rm } from 'node:fs/promises';
import {
  dirContentsToObject,
  waitForUrls,
  runSkuScriptInDir,
  getAppSnapshot,
  startAssetServer,
} from '@sku-private/test-utils';
import gracefulSpawn from '../packages/sku/lib/gracefulSpawn.js';

import skuConfig from '@sku-fixtures/typescript-css-modules/sku.config.ts';
import skuSsrConfig from '@sku-fixtures/typescript-css-modules/sku-ssr.config.ts';
import type { ChildProcess } from 'node:child_process';

const appDir = path.dirname(
  require.resolve('@sku-fixtures/typescript-css-modules/sku.config.ts'),
);
const distDir = path.resolve(appDir, 'dist');
const distSsrDir = path.resolve(appDir, 'dist-ssr');

assert(skuSsrConfig.serverPort, 'sku config has serverPort');
const backendUrl = `http://localhost:${skuSsrConfig.serverPort}`;

describe('typescript-css-modules', () => {
  describe('build', () => {
    assert(skuConfig.port, 'sku config has port');
    const url = `http://localhost:${skuConfig.port}`;
    let process: ChildProcess;

    beforeAll(async () => {
      await runSkuScriptInDir('build', appDir);
      process = await runSkuScriptInDir('serve', appDir);
      await waitForUrls(url);
    });

    afterAll(async () => {
      await process.kill();
      // Clean up dist dir to prevent pollution of linted files in lint test
      await rm(distDir, { recursive: true, force: true });
    });

    it('should create valid app', async () => {
      const app = await getAppSnapshot(url);
      expect(app).toMatchSnapshot();
    });

    it('should generate the expected files', async () => {
      const files = await dirContentsToObject(distDir);
      expect(files).toMatchSnapshot();
    });
  });

  describe('build-ssr', () => {
    let server: ChildProcess;
    let closeAssetServer: () => void;

    beforeAll(async () => {
      await runSkuScriptInDir('build-ssr', appDir, [
        '--config=sku-ssr.config.ts',
      ]);
      server = gracefulSpawn('node', ['server'], {
        cwd: distSsrDir,
        stdio: 'inherit',
      });
      closeAssetServer = await startAssetServer(4003, distSsrDir);
      await waitForUrls(backendUrl, 'http://localhost:4003');
    });

    afterAll(async () => {
      await server.kill();
      closeAssetServer();
      // Clean up dist-ssr dir to prevent pollution of linted files in lint test
      await rm(distSsrDir, { recursive: true, force: true });
    });

    it('should create valid app', async () => {
      const app = await getAppSnapshot(backendUrl);
      expect(app).toMatchSnapshot();
    });

    it('should generate the expected files', async () => {
      const files = await dirContentsToObject(distSsrDir, ['.js', '.css']);
      expect(files).toMatchSnapshot();
    });
  });

  describe('start', () => {
    const devServerUrl = `http://localhost:8204`;
    let server: ChildProcess;

    beforeAll(async () => {
      server = await runSkuScriptInDir('start', appDir);
      await waitForUrls(devServerUrl);
    });

    afterAll(async () => {
      await server.kill();
    });

    it('should start a development server', async () => {
      const snapshot = await getAppSnapshot(devServerUrl);
      expect(snapshot).toMatchSnapshot();
    });
  });

  describe('test', () => {
    let exitCode: number | null;

    beforeAll(async () => {
      const { child } = await runSkuScriptInDir('test', appDir);
      exitCode = child.exitCode;
    });

    it('should handle Vanilla Extract styles in tests', async () => {
      expect(exitCode).toEqual(0);
    });
  });

  describe('lint', () => {
    let exitCode: number | null;

    beforeAll(async () => {
      // run build first to ensure typescript declarations are generated
      await runSkuScriptInDir('build', appDir);
      const { child } = await runSkuScriptInDir('lint', appDir);
      exitCode = child.exitCode;
    });

    it('should handle tsc and eslint', async () => {
      expect(exitCode).toEqual(0);
    });
  });
});
