import { describe, beforeAll, afterAll, it } from 'vitest';
import { getAppSnapshot } from '@sku-private/vitest-utils';
import path from 'node:path';
import {
  runSkuScriptInDir,
  waitForUrls,
  createCancelSignal,
  getPort,
  dirContentsToObject,
} from '@sku-private/test-utils';

import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const appDir = path.dirname(
  require.resolve('@sku-fixtures/public-path/sku.config.js'),
);

const distDir = path.resolve(appDir, 'dist');

describe('public path', () => {
  describe.concurrent.each(['vite', 'webpack'])(
    'bundler: %s',
    async (bundler) => {
      const port = await getPort();
      const args = ['--strict-port', `--port=${port}`];
      if (bundler === 'vite')
        args.push(
          ...['--experimental-bundler', '--config', 'sku.config.vite.js'],
        );

      describe('build and serve', () => {
        const url = `http://localhost:${port}`;
        const { cancel, signal } = createCancelSignal();

        beforeAll(async () => {
          await runSkuScriptInDir('build', appDir);
          runSkuScriptInDir('serve', appDir, { args, signal });
          await waitForUrls(url);
        });

        afterAll(async () => {
          cancel();
        });

        it('should create valid app with no unresolved resources', async ({
          expect,
        }) => {
          const app = await getAppSnapshot({ url, expect });
          expect(app).toMatchSnapshot();
        });

        it('should generate the expected files', async ({ expect }) => {
          const files = await dirContentsToObject(distDir);
          expect(files).toMatchSnapshot();
        });
      });
    },
  );
});
