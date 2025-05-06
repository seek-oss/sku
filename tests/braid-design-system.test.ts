import { describe, beforeAll, afterAll, it } from 'vitest';
import path from 'node:path';
import {
  dirContentsToObject,
  waitForUrls,
  runSkuScriptInDir,
  getPort,
  createCancelSignal,
} from '@sku-private/test-utils';

import { getAppSnapshot } from '@sku-private/vitest-utils';

import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const appDir = path.dirname(
  require.resolve('@sku-fixtures/braid-design-system/sku.config.js'),
);
const distDir = path.resolve(appDir, 'dist');

function getLocalUrl(site: string, port: number) {
  const host = site === 'jobStreet' ? 'dev.jobstreet.com' : 'dev.seek.com.au';

  return `http://${host}:${port}`;
}

describe('braid-design-system', () => {
  describe.sequential.for(['vite', 'webpack'])('bundler %s', (bundler) => {
    describe('start', async () => {
      const { cancel, signal } = createCancelSignal();

      const port = await getPort();
      const args = ['--strict-port', `--port=${port}`];
      if (bundler === 'vite') {
        args.push('--config', 'sku.config.vite.js', '--experimental-bundler');
      }

      beforeAll(async () => {
        runSkuScriptInDir('start', appDir, { args, signal });
        await waitForUrls(getLocalUrl('seekAnz', port));
      }, 230000);

      afterAll(async () => {
        cancel();
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
      const { cancel, signal } = createCancelSignal();

      const port = await getPort();
      const portArgs = ['--strict-port', `--port=${port}`];
      const args: Record<string, string[]> = {
        vite: ['--config', 'sku.config.vite.js', '--experimental-bundler'],
      };

      beforeAll(async () => {
        await runSkuScriptInDir('build', appDir, { args: args[bundler] });
        runSkuScriptInDir('serve', appDir, {
          args: portArgs,
          signal,
        });
        await waitForUrls(getLocalUrl('seekAnz', port));
      });

      afterAll(async () => {
        cancel();
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
    expect(runSkuScriptInDir('test', appDir)).resolves.not.toThrowError();
  });
});
