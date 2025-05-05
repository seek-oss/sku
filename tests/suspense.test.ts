import { describe, beforeAll, afterAll, it } from 'vitest';
import { getAppSnapshot } from '@sku-private/vitest-utils';
import path from 'node:path';
import {
  dirContentsToObject,
  getPort,
  runSkuScriptInDir,
  waitForUrls,
} from '@sku-private/test-utils';
import { createRequire } from 'node:module';
import { createCancelSignal } from '@sku-private/test-utils/process.ts';

const require = createRequire(import.meta.url);

const appDir = path.dirname(
  require.resolve('@sku-fixtures/suspense/sku.config.js'),
);

const targetDirectory = `${appDir}/dist`;

describe('suspense', () => {
  describe.sequential.for(['vite', 'webpack'])(
    'bundler %s',
    async (bundler) => {
      const port = await getPort();
      const args: string[] = [];

      const url = `http://localhost:${port}`;
      if (bundler === 'vite')
        args.push(
          ...['--experimental-bundler', '--config', 'sku.config.vite.js'],
        );
      describe('build and serve', () => {
        const { cancel, signal } = createCancelSignal();

        beforeAll(async () => {
          await runSkuScriptInDir('build', appDir, args);
          runSkuScriptInDir(
            'serve',
            appDir,
            ['--strict-port', `--port=${port}`],
            { cancelSignal: signal },
          );
          await waitForUrls(url);
        });

        afterAll(async () => {
          cancel();
        });

        it('should return home page', async ({ expect }) => {
          const app = await getAppSnapshot({ url, expect });
          expect(app).toMatchSnapshot();
        });

        it('should generate the expected files', async ({ expect }) => {
          const files = await dirContentsToObject(targetDirectory);
          expect(files).toMatchSnapshot();
        });
      });
    },
  );
});
