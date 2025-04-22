import { describe, beforeAll, afterAll, it } from 'vitest';
import path from 'node:path';
import {
  dirContentsToObject,
  waitForUrls,
  runSkuScriptInDir,
  getPort,
} from '@sku-private/test-utils';

import { getAppSnapshot } from '@sku-private/vitest-utils';

import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const appDir = path.dirname(
  require.resolve('@sku-fixtures/braid-design-system/sku.config.js'),
);
const distDir = path.resolve(appDir, 'dist');

function getLocalUrl(site, port) {
  const host = site === 'jobStreet' ? 'dev.jobstreet.com' : 'dev.seek.com.au';

  return `http://${host}:${port}`;
}

describe('braid-design-system', () => {
  describe.each(['vite', 'webpack'])('bundler %s', (bundler) => {
    describe('start', async () => {
      let server;

      const port = await getPort();
      const args = ['--strict-port', `--port=${port}`];
      if (bundler === 'vite') {
        args.push('--config', 'sku.config.vite.js', '--experimental-bundler');
      }

      beforeAll(async () => {
        server = await runSkuScriptInDir('start', appDir, args);
        await waitForUrls(getLocalUrl('seekAnz', port));
      });

      afterAll(async () => {
        await server.kill();
      });

      it('should return development seekAnz site', async ({ expect }) => {
        const snapshot = await getAppSnapshot({
          url: getLocalUrl('seekAnz', port),
          expect,
        });
        expect(snapshot).toMatchSnapshot();
      });

      it('should return development jobStreet site', async ({ expect }) => {
        const snapshot = await getAppSnapshot({
          url: getLocalUrl('jobStreet', port),
          expect,
        });
        expect(snapshot).toMatchSnapshot();
      });
    });

    describe('build', async () => {
      let process;

      const port = await getPort();
      const args = ['--strict-port', `--port=${port}`];
      if (bundler === 'vite') {
        args.push('--config', 'sku.config.vite.js', '--experimental-bundler');
      }

      beforeAll(async () => {
        await runSkuScriptInDir('build', appDir);
        process = await runSkuScriptInDir('serve', appDir, args);
        await waitForUrls(getLocalUrl('seekAnz', port));
      }, 230000);

      afterAll(async () => {
        await process.kill();
      });

      it('should return built jobStreet site', async ({ expect }) => {
        const app = await getAppSnapshot({
          url: getLocalUrl('jobStreet', port),
          expect,
        });
        expect(app).toMatchSnapshot();
      });

      it('should return built seekAnz site', async ({ expect }) => {
        const app = await getAppSnapshot({
          url: getLocalUrl('seekAnz', port),
          expect,
        });
        expect(app).toMatchSnapshot();
      });

      it('should generate the expected files', async ({ expect }) => {
        const files = await dirContentsToObject(distDir);
        expect(files).toMatchSnapshot();
      });
    });
  });

  it('should handle braid-design-system in tests', async ({ expect }) => {
    const { child } = await runSkuScriptInDir('test', appDir);
    expect(child.exitCode).toEqual(0);
  });
});
