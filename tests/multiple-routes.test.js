import path from 'node:path';
import {
  dirContentsToObject,
  runSkuScriptInDir,
  waitForUrls,
  getAppSnapshot,
} from '@sku-private/test-utils';

import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const appDir = path.dirname(
  require.resolve('@sku-fixtures/multiple-routes/sku.config.js'),
);

const targetDirectory = `${appDir}/dist`;
const url = `http://localhost:8202`;

const renderPageCorrectly = async ({ page, pageUrl, checkForLoadingText }) => {
  it(`should render ${page} page correctly`, async () => {
    const snapshot = await getAppSnapshot(pageUrl);
    expect(snapshot).toMatchSnapshot();
    expect(snapshot.sourceHtml).not.toContain(checkForLoadingText);
  });
};

describe('multiple-routes', () => {
  describe.each(['vite', 'webpack'])('bundler: %s', (bundler) => {
    const args =
      bundler === 'vite'
        ? [
            '--convert-loadable',
            '--experimental-bundler',
            '--config',
            'sku.config.vite.js',
          ]
        : [];

    describe('start', () => {
      let process;

      beforeAll(async () => {
        process = await runSkuScriptInDir('start', appDir, args);
        await waitForUrls(url);
      });

      afterAll(async () => {
        await process.kill();
      });

      renderPageCorrectly({
        page: 'home',
        pageUrl: url,
        checkForLoadingText: 'Loading Home...',
      });

      renderPageCorrectly({
        page: 'details',
        pageUrl: `${url}/details/123`,
        checkForLoadingText: 'Loading Details...',
      });
    });

    describe('build and serve', () => {
      let process;

      beforeAll(async () => {
        await runSkuScriptInDir('build', appDir, args);
        process = await runSkuScriptInDir('serve', appDir);
        await waitForUrls(url);
      });

      afterAll(async () => {
        await process.kill();
      });

      renderPageCorrectly({
        page: 'home',
        pageUrl: url,
        checkForLoadingText: 'Loading Home...',
      });

      renderPageCorrectly({
        page: 'details',
        pageUrl: `${url}/details/123`,
        checkForLoadingText: 'Loading Details...',
      });

      it('should generate the expected files', async () => {
        const files = await dirContentsToObject(targetDirectory);
        expect(files).toMatchSnapshot();
      });
    });
  });

  describe('test', () => {
    it('should handle dynamic imports in tests', async () => {
      const { child } = await runSkuScriptInDir('test', appDir);
      expect(child.exitCode).toEqual(0);
    });
  });
});
