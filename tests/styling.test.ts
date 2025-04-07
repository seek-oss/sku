import { describe, beforeAll, afterAll, it, expect } from 'vitest';
import { getAppSnapshot } from '@sku-private/vitest-utils';
import assert from 'node:assert/strict';
import path from 'node:path';
import type { Page } from 'puppeteer';
import {
  dirContentsToObject,
  waitForUrls,
  runSkuScriptInDir,
  getStoryPage,
  getTextContentFromFrameOrPage,
  gracefulSpawn,
} from '@sku-private/test-utils';
import type { ChildProcess } from 'node:child_process';
import skuConfigImport from '../fixtures/styling/sku.config.ts';

import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const appDir = path.dirname(
  require.resolve('@sku-fixtures/styling/sku.config.ts'),
);
const distDir = path.resolve(appDir, 'dist');

const skuConfig = skuConfigImport as unknown as typeof skuConfigImport.default;

assert(skuConfig.port, 'sku config has port');
const devServerUrl = `http://localhost:${skuConfig.port}`;

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
      expect(files).toMatchSnapshot();
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

    it('should handle Vanilla Extract styles in tests', async () => {
      expect(exitCode).toEqual(0);
    });
  });

  describe('storybook', () => {
    const storybookPort = 8090;
    const storybookBaseUrl = `http://localhost:${storybookPort}`;

    const storyIframePath = '/iframe.html?viewMode=story&id=blueblock--default';
    const storyIframeUrl = `${storybookBaseUrl}${storyIframePath}`;

    let server: ChildProcess;
    let storyPage: Page;

    beforeAll(async () => {
      server = gracefulSpawn(
        'pnpm',
        [
          'storybook',
          'dev',
          '--ci',
          '--quiet',
          '--port',
          storybookPort.toString(),
        ],
        {
          cwd: appDir,
          stdio: 'inherit',
        },
      );
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

    it('should render Vanilla Extract styles', async () => {
      const { fontSize } = await getTextContentFromFrameOrPage(
        storyPage,
        '[data-automation-vanilla]',
      );

      expect(fontSize).toEqual('64px');
    });
  });
});
