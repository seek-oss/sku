import { describe, beforeAll, afterAll, it } from 'vitest';
import { getAppSnapshot } from '@sku-private/vitest-utils';
import path from 'node:path';
import fs from 'node:fs/promises';
import {
  getPort,
  runSkuScriptInDir,
  waitForUrls,
} from '@sku-private/test-utils';

import skuServerConfig from '@sku-fixtures/sku-with-https/sku-server.config.mjs';

import { createRequire } from 'node:module';

const { serverPort } = skuServerConfig;

const require = createRequire(import.meta.url);

const appDir = path.dirname(
  require.resolve('@sku-fixtures/sku-with-https/sku.config.mjs'),
);

describe('sku-with-https', () => {
  describe.each(['vite', 'webpack'])('bundler: %s', async (bundler) => {
    const port = await getPort();
    const args = ['--strict-port', `--port=${port}`];
    if (bundler === 'vite')
      args.push(
        ...['--experimental-bundler', '--config', 'sku.config.vite.mjs'],
      );
    describe('start', () => {
      const url = `https://localhost:${port}`;

      let process;

      beforeAll(async () => {
        process = await runSkuScriptInDir('start', appDir, args);
        await waitForUrls(url, `${url}/test-middleware`);
      });

      afterAll(async () => {
        await process.kill();
      });

      it('should start a development server', async ({ expect }) => {
        const snapshot = await getAppSnapshot({ url, expect });
        expect(snapshot).toMatchSnapshot();
      });
      it('should support the supplied middleware', async ({ expect }) => {
        const snapshot = await getAppSnapshot({
          url: `${url}/test-middleware`,
          expect,
        });
        expect(snapshot).toMatchSnapshot();
      });
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

    it('should support the supplied middleware', async ({ expect }) => {
      const snapshot = await getAppSnapshot({
        url: `${url}/test-middleware`,
        expect,
      });
      expect(snapshot).toMatchSnapshot();
    });
  });

  describe('serve', async () => {
    const port = await getPort();
    const url = `https://localhost:${port}`;
    let process;

    beforeAll(async () => {
      await runSkuScriptInDir('build', appDir);
      process = await runSkuScriptInDir('serve', appDir, [
        '--strict-port',
        `--port=${port}`,
        ,
      ]);
      await waitForUrls(url, `${url}/test-middleware`);
    });

    afterAll(async () => {
      await process.kill();
    });

    it('should start a development server', async ({ expect }) => {
      const snapshot = await getAppSnapshot({ url, expect });
      expect(snapshot).toMatchSnapshot();
    });

    it('should support the supplied middleware', async ({ expect }) => {
      const snapshot = await getAppSnapshot({
        url: `${url}/test-middleware`,
        expect,
      });
      expect(snapshot).toMatchSnapshot();
    });
  });

  describe('.gitignore', () => {
    it('should add the .ssl directory to .gitignore', async ({ expect }) => {
      const ignoreContents = await fs.readFile(
        path.join(appDir, '.gitignore'),
        'utf-8',
      );
      expect(ignoreContents.split('\n')).toContain(`.ssl`);
    });
  });
});
