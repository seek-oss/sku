import assert from 'node:assert/strict';
import path from 'path';
import type { Frame } from 'puppeteer';
import {
  dirContentsToObject,
  waitForUrls,
  runSkuScriptInDir,
  getAppSnapshot,
  getStorybookFrame,
  getTextContentFromStorybookFrame,
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
assert(skuConfig.storybookPort, 'sku config has storybookPort');
const storybookUrl = `http://localhost:${skuConfig.storybookPort}`;

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

  describe('storybook', () => {
    let server;
    let storybookFrame: Frame;

    beforeAll(async () => {
      server = await runSkuScriptInDir('storybook', appDir, ['--ci']);
      await waitForUrls(storybookUrl);
      storybookFrame = await getStorybookFrame(storybookUrl);
    }, 200000);

    afterAll(async () => {
      await server.kill();
    });

    it('should render external styles', async () => {
      const { text, fontSize } = await getTextContentFromStorybookFrame(
        storybookFrame,
        '[data-automation-external]',
      );

      expect(text).toEqual('This should be invisible');
      expect(fontSize).toEqual('9px');
    });

    it('should render LESS styles', async () => {
      const { fontSize } = await getTextContentFromStorybookFrame(
        storybookFrame,
        '[data-automation-less]',
      );

      expect(fontSize).toEqual('32px');
    });

    it('should render Vanilla Extract styles', async () => {
      const { fontSize } = await getTextContentFromStorybookFrame(
        storybookFrame,
        '[data-automation-vanilla]',
      );

      expect(fontSize).toEqual('64px');
    });
  });
});
