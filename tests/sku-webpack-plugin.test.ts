import { describe, beforeAll, afterAll, it } from 'vitest';
import { getAppSnapshot } from '@sku-private/puppeteer';
import path from 'node:path';
import {
  dirContentsToObject,
  waitForUrls,
  startAssetServer,
} from '@sku-private/test-utils';
import { runBin, startBin } from '../packages/sku/dist/utils/runBin.js';
import { createRequire } from 'node:module';
import type { ChildProcess } from 'node:child_process';

const require = createRequire(import.meta.url);

const appDir = path.dirname(
  require.resolve('@sku-fixtures/sku-webpack-plugin/package.json'),
);

const distDir = path.resolve(appDir, 'dist');

const port = 9876;
const devServerUrl = `http://localhost:${port}`;

describe('sku-webpack-plugin', () => {
  describe('start', () => {
    let process: ChildProcess;

    beforeAll(async () => {
      process = startBin({
        packageName: 'webpack-dev-server',
        args: ['--mode', 'development'],
        options: {
          cwd: appDir,
        },
      });

      await waitForUrls(devServerUrl);
    }, 150000);

    afterAll(async () => {
      await process.kill();
    });

    it('should start a development server', async ({ expect }) => {
      const snapshot = await getAppSnapshot({
        url: devServerUrl,
        expect,
      });
      expect(snapshot).toMatchSnapshot();
    });
  });

  describe('build', () => {
    let closeAssetServer: () => void;

    beforeAll(async () => {
      await runBin({
        packageName: 'webpack-cli',
        args: ['--mode', 'production', '--no-stats'],
        options: {
          cwd: appDir,
          env: {
            ...process.env,
            NODE_ENV: 'production',
          },
        },
      });

      closeAssetServer = await startAssetServer(port, distDir);
    }, 150000);

    afterAll(() => {
      closeAssetServer();
    });

    it('should create valid app', async ({ expect }) => {
      const app = await getAppSnapshot({ url: devServerUrl, expect });
      expect(app).toMatchSnapshot();
    });

    it('should generate the expected files', async ({ expect }) => {
      const files = await dirContentsToObject(distDir);
      expect(files).toMatchSnapshot();
    });
  });
});
