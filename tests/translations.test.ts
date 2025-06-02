import { describe, beforeAll, afterAll, it } from 'vitest';
import { getAppSnapshot } from '@sku-private/vitest-utils';
import assert from 'node:assert/strict';
import path from 'node:path';
import {
  getPort,
  runSkuScriptInDir,
  waitForUrls,
  createCancelSignal,
} from '@sku-private/test-utils';

import skuConfig from '@sku-fixtures/translations/sku.config.ts';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const appDir = path.dirname(
  require.resolve('@sku-fixtures/translations/sku.config.ts'),
);

assert(skuConfig.port, 'sku config has port');

describe('translations', () => {
  describe.sequential.for(['vite', 'webpack'])(
    'bundler %s',
    async (bundler) => {
      const { cancel, signal } = createCancelSignal();
      const port = await getPort();
      const baseUrl = `http://localhost:${port}`;
      const args: Record<string, string[]> = {
        vite: ['--config', 'sku.config.vite.ts', '--experimental-bundler'],
      };

      beforeAll(async () => {
        await runSkuScriptInDir('build', appDir, { args: args[bundler] });
        runSkuScriptInDir('serve', appDir, {
          args: ['--strict-port', `--port=${port}`],
          signal,
        });
        await waitForUrls(`${baseUrl}/en`);
      });

      afterAll(() => {
        cancel();
      });

      it('should render en', async ({ expect }) => {
        const app = await getAppSnapshot({ url: `${baseUrl}/en`, expect });
        expect(app).toMatchSnapshot();
      });

      it('should render fr', async ({ expect }) => {
        const app = await getAppSnapshot({ expect, url: `${baseUrl}/fr` });
        expect(app).toMatchSnapshot();
      });

      it('should render en-PSEUDO post-hydration', async ({ expect }) => {
        const app = await getAppSnapshot({
          expect,
          url: `${baseUrl}/en?pseudo=true`,
        });
        expect(app).toMatchSnapshot();
      });

      it('should support query parameters', async ({ expect }) => {
        const app = await getAppSnapshot({ expect, url: `${baseUrl}/en?a=1` });
        expect(app).toMatchSnapshot();
      });
    },
  );
});
