import path from 'node:path';
import fs from 'node:fs/promises';
import {
  runSkuScriptInDir,
  waitForUrls,
  getAppSnapshot,
} from '@sku-private/test-utils';

import skuServerConfig from '@sku-fixtures/sku-with-https/sku-server.config.mjs';

import { createRequire } from 'node:module';

const { port, serverPort } = skuServerConfig;

const require = createRequire(import.meta.url);

const appDir = path.dirname(
  require.resolve('@sku-fixtures/sku-with-https/sku.config.mjs'),
);

describe('sku-with-https', () => {
  describe('start', () => {
    const url = `https://localhost:${port}`;
    let process;

    beforeAll(async () => {
      process = await runSkuScriptInDir('start', appDir, [
        '--config=sku.config.mjs',
      ]);
      await waitForUrls(url, `${url}/test-middleware`);
    });

    afterAll(async () => {
      await process.kill();
    });

    it('should start a development server', async () => {
      const snapshot = await getAppSnapshot(url);
      expect(snapshot).toMatchSnapshot();
    });
    it('should support the supplied middleware', async () => {
      const snapshot = await getAppSnapshot(`${url}/test-middleware`);
      expect(snapshot).toMatchSnapshot();
    });
  });

  describe('start-ssr', () => {
    const url = `https://localhost:${serverPort}`;
    let process;

    beforeAll(async () => {
      process = await runSkuScriptInDir('start-ssr', appDir, [
        '--config=sku-server.config.mjs',
      ]);
      await waitForUrls(url, `${url}/test-middleware`);
    });

    afterAll(async () => {
      await process.kill();
    });

    it('should support the supplied middleware', async () => {
      const snapshot = await getAppSnapshot(`${url}/test-middleware`);
      expect(snapshot).toMatchSnapshot();
    });
  });

  describe('serve', () => {
    const url = `https://localhost:${port}`;
    let process;

    beforeAll(async () => {
      await runSkuScriptInDir('build', appDir, ['--config=sku.config.mjs']);
      process = await runSkuScriptInDir('serve', appDir, [
        '--config=sku.config.mjs',
      ]);
      await waitForUrls(url, `${url}/test-middleware`);
    });

    afterAll(async () => {
      await process.kill();
    });

    it('should start a development server', async () => {
      const snapshot = await getAppSnapshot(url);
      expect(snapshot).toMatchSnapshot();
    });

    it('should support the supplied middleware', async () => {
      const snapshot = await getAppSnapshot(`${url}/test-middleware`);
      expect(snapshot).toMatchSnapshot();
    });
  });

  describe('.gitignore', () => {
    it('should add the .ssl directory to .gitignore', async () => {
      const ignoreContents = await fs.readFile(
        path.join(appDir, '.gitignore'),
        'utf-8',
      );
      expect(ignoreContents.split('\n')).toContain(`.ssl`);
    });
  });
});
