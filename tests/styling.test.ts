import { describe, beforeAll, afterAll, it } from 'vitest';
import { getAppSnapshot } from '@sku-private/puppeteer';
import assert from 'node:assert/strict';
import path from 'node:path';
import type { Page } from 'puppeteer';
import {
  dirContentsToObject,
  waitForUrls,
  runSkuScriptInDir,
  getStoryPage,
  getTextContentFromFrameOrPage,
  createCancelSignal,
  run,
} from '@sku-private/test-utils';
import skuConfig from '@sku-fixtures/styling/sku.config.ts';

import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const appDir = path.dirname(
  require.resolve('@sku-fixtures/styling/sku.config.ts'),
);
const distDir = path.resolve(appDir, 'dist');

assert(skuConfig.port, 'sku config has port');
const devServerUrl = `http://localhost:${skuConfig.port}`;

describe('styling', () => {
  describe('build', () => {
    const { cancel, signal } = createCancelSignal();

    beforeAll(async () => {
      await runSkuScriptInDir('build', appDir);
      runSkuScriptInDir('serve', appDir, {
        signal,
      });
      await waitForUrls(devServerUrl);
    });

    afterAll(async () => {
      cancel();
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

  describe('start', () => {
    const { cancel, signal } = createCancelSignal();

    beforeAll(async () => {
      runSkuScriptInDir('start', appDir, {
        signal,
      });
      await waitForUrls(devServerUrl);
    });

    afterAll(async () => {
      cancel();
    });

    it('should start a development server', async ({ expect }) => {
      const snapshot = await getAppSnapshot({ url: devServerUrl, expect });
      expect(snapshot).toMatchSnapshot();
    });
  });

  describe('test', () => {
    it('should handle Vanilla Extract styles in tests', async ({ expect }) => {
      await expect(
        runSkuScriptInDir('test', appDir),
      ).resolves.not.toThrowError();
    });
  });

  describe('storybook', () => {
    const storybookPort = 8090;
    const storybookBaseUrl = `http://localhost:${storybookPort}`;

    const storyIframePath = '/iframe.html?viewMode=story&id=blueblock--default';
    const storyIframeUrl = `${storybookBaseUrl}${storyIframePath}`;

    const { cancel, signal } = createCancelSignal();
    let storyPage: Page;

    beforeAll(async () => {
      run('pnpm', {
        args: [
          'storybook',
          'dev',
          '--ci',
          '--quiet',
          '--port',
          storybookPort.toString(),
        ],
        cwd: appDir,
        stdio: 'inherit',
        signal,
      });
      await waitForUrls(storyIframeUrl);
      storyPage = await getStoryPage(storyIframeUrl);
    }, 200000);

    afterAll(async () => {
      await storyPage?.close();
      cancel();
    });

    it('should render external styles', async ({ expect }) => {
      const { text, fontSize } = await getTextContentFromFrameOrPage(
        storyPage,
        '[data-automation-external]',
      );

      expect(text).toEqual('This should be invisible');
      expect(fontSize).toEqual('9px');
    });

    it('should render Vanilla Extract styles', async ({ expect }) => {
      const { fontSize } = await getTextContentFromFrameOrPage(
        storyPage,
        '[data-automation-vanilla]',
      );

      expect(fontSize).toEqual('64px');
    });
  });
});
