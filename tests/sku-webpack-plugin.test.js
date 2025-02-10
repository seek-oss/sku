import path from 'node:path';
import {
  dirContentsToObject,
  getAppSnapshot,
  waitForUrls,
  startAssetServer,
} from '@sku-private/test-utils';
import { runBin, startBin } from '../packages/sku/dist/utils/runBin.js';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const appDir = path.dirname(
  require.resolve('@sku-fixtures/sku-webpack-plugin/package.json'),
);

const distDir = path.resolve(appDir, 'dist');

const port = 9876;
const devServerUrl = `http://localhost:${port}`;

describe('sku-webpack-plugin', () => {
  describe('start', () => {
    let process;

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

    it('should start a development server', async () => {
      const snapshot = await getAppSnapshot(devServerUrl);
      expect(snapshot).toMatchSnapshot();
    });
  });

  describe('build', () => {
    let closeAssetServer;

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

    it('should create valid app', async () => {
      const app = await getAppSnapshot(devServerUrl);
      expect(app).toMatchSnapshot();
    });

    it('should generate the expected files', async () => {
      const files = await dirContentsToObject(distDir);
      expect(files).toMatchSnapshot();
    });
  });
});
