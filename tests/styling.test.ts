import assert from 'assert';
import path from 'path';
import { rimraf } from 'rimraf';
import {
  dirContentsToObject,
  waitForUrls,
  runSkuScriptInDir,
  getAppSnapshot,
} from '@sku-private/test-utils';

const appDir = path.dirname(
  require.resolve('@sku-fixtures/styling/sku.config.ts'),
);
const distDir = path.resolve(appDir, 'dist');
const srcDir = path.resolve(appDir, 'src');

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { default: skuConfig } = require(`${appDir}/sku.config.ts`);

assert(skuConfig.port, 'sku config has port');
const devServerUrl = `http://localhost:${skuConfig.port}`;

const cssTypes = ['.less.d.ts'];

describe('styling', () => {
  describe('build', () => {
    let process;

    beforeAll(async () => {
      await runSkuScriptInDir('build', appDir);
      process = await runSkuScriptInDir('serve', appDir);
      await waitForUrls(devServerUrl);
    });

    afterAll(async () => {
      await process.kill();
      // Clean up dist dir to prevent pollution of linted files in lint test
      await rimraf(distDir);
    });

    it('should create valid app', async () => {
      const app = await getAppSnapshot(devServerUrl);
      expect(app).toMatchSnapshot();
    });

    it('should generate the expected files', async () => {
      const files = await dirContentsToObject(distDir);
      const cssTypeFiles = await dirContentsToObject(srcDir, cssTypes);
      expect({
        ...files,
        ...cssTypeFiles,
      }).toMatchSnapshot();
    });
  });

  describe('start', () => {
    let server;

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
    let exitCode;

    beforeAll(async () => {
      const { child } = await runSkuScriptInDir('test', appDir);
      exitCode = child.exitCode;
    });

    it('should handle LESS in tests', async () => {
      expect(exitCode).toEqual(0);
    });
  });
});
