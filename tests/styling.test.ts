import assert from 'node:assert/strict';
import path from 'node:path';
import type { Page } from 'puppeteer';
import {
  dirContentsToObject,
  waitForUrls,
  runSkuScriptInDir,
  getAppSnapshot,
  getTextContentFromFrameOrPage,
  getStoryPage,
} from '@sku-private/test-utils';
import type { ChildProcess } from 'node:child_process';

const appDir = path.dirname(
  require.resolve('@sku-fixtures/styling/sku.config.ts'),
);
const distDir = path.resolve(appDir, 'dist');
const srcDir = path.resolve(appDir, 'src');

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { default: skuConfig } = require(`${appDir}/sku.config.ts`);

assert(skuConfig.port, 'sku config has port');
assert(skuConfig.storybookPort, 'sku config has storybookPort');
const devServerUrl = `http://localhost:${skuConfig.port}`;

const cssTypes = ['.less.d.ts'];

describe('styling', () => {
  describe('build', () => {
    let process: ChildProcess;

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

    it('should handle LESS in tests', async () => {
      expect(exitCode).toEqual(0);
    });
  });

  describe('storybook', () => {
    let server: ChildProcess;
    let storyPage: Page;

    const storybookBaseUrl = `http://localhost:${skuConfig.storybookPort}`;
    const storyIframePath = '/iframe.html?viewMode=story&id=blueblock--default';
    const storyIframeUrl = `${storybookBaseUrl}${storyIframePath}`;

    beforeAll(async () => {
      server = await runSkuScriptInDir('storybook', appDir, [
        '--ci',
        '--quiet',
      ]);
      await waitForUrls(storyIframeUrl);
      storyPage = await getStoryPage(storyIframeUrl);
    }, 200000);

    afterAll(async () => {
      await server.kill();
    });

    it('should render external styles', async () => {
      const { text, fontSize } = await getTextContentFromFrameOrPage(
        storyPage,
        '[data-automation-external]',
      );

      expect(text).toEqual('This should be invisible');
      expect(fontSize).toEqual('9px');
    });

    it('should render LESS styles', async () => {
      const { fontSize } = await getTextContentFromFrameOrPage(
        storyPage,
        '[data-automation-less]',
      );

      expect(fontSize).toEqual('32px');
    });

    it('should render Vanilla Extract styles', async () => {
      const { fontSize } = await getTextContentFromFrameOrPage(
        storyPage,
        '[data-automation-vanilla]',
      );

      expect(fontSize).toEqual('64px');
    });
  });
});
