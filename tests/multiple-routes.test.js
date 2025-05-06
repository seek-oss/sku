import { describe, beforeAll, afterAll, it } from 'vitest';
import path from 'node:path';
import {
  dirContentsToObject,
  getPort,
  runSkuScriptInDir,
  waitForUrls,
  createCancelSignal,
} from '@sku-private/test-utils';
import { getAppSnapshot } from '@sku-private/vitest-utils';

import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const appDir = path.dirname(
  require.resolve('@sku-fixtures/multiple-routes/sku.config.js'),
);

const targetDirectory = `${appDir}/dist`;

const renderPageCorrectly = async ({ page, pageUrl }) => {
  it(`should render ${page} page correctly`, async ({ expect }) => {
    const snapshot = await getAppSnapshot({ url: pageUrl, expect });
    expect(snapshot).toMatchSnapshot();
  });
};

describe('multiple-routes', () => {
  describe.sequential.for(['vite', 'webpack'])('bundler: %s', (bundler) => {
    describe('start', async () => {
      const { cancel, signal } = createCancelSignal();

      const port = await getPort();

      const url = `http://localhost:${port}`;
      const args = ['--strict-port', `--port=${port}`];

      if (bundler === 'vite') {
        args.push(
          '--convert-loadable',
          '--experimental-bundler',
          '--config',
          'sku.config.vite.js',
        );
      }

      beforeAll(async () => {
        runSkuScriptInDir('start', appDir, args, {
          signal,
        });
        await waitForUrls(url);
      });

      afterAll(async () => {
        cancel();
      });

      renderPageCorrectly({
        page: 'home',
        pageUrl: url,
      });

      renderPageCorrectly({
        page: 'details',
        pageUrl: `${url}/details/123`,
      });
    });

    describe('build and serve', async () => {
      const { cancel, signal } = createCancelSignal();

      const port = await getPort();

      const url = `http://localhost:${port}`;
      const portArgs = ['--strict-port', `--port=${port}`];

      const args = [];

      if (bundler === 'vite') {
        args.push(
          '--convert-loadable',
          '--experimental-bundler',
          '--config',
          'sku.config.vite.js',
        );
      }

      beforeAll(async () => {
        await runSkuScriptInDir('build', appDir, args);
        runSkuScriptInDir('serve', appDir, portArgs, {
          signal,
        });
        await waitForUrls(url);
      });

      afterAll(async () => {
        cancel();
      });

      renderPageCorrectly({
        page: 'home',
        pageUrl: url,
      });

      renderPageCorrectly({
        page: 'details',
        pageUrl: `${url}/details/123`,
      });

      it('should generate the expected files', async ({ expect }) => {
        const files = await dirContentsToObject(targetDirectory);
        expect(files).toMatchSnapshot();
      });
    });
  });

  describe('test', () => {
    it('should handle dynamic imports in tests', async ({ expect }) => {
      await expect(
        runSkuScriptInDir('test', appDir),
      ).resolves.not.toThrowError();
    });
  });
});
