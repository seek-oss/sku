import { describe, it } from 'vitest';

import path from 'node:path';

import {
  runSkuScriptInDir,
  dirContentsToObject,
} from '@sku-private/test-utils';

import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const appDir = path.dirname(
  require.resolve('@sku-fixtures/source-maps/sku.config.ts'),
);

describe('source-maps', () => {
  const args: Record<string, string[]> = {
    vite: ['--config', 'sku.config.vite.ts', '--experimental-bundler'],
  };

  describe.for(['vite', 'webpack'])('bundler %s', (bundler) => {
    describe.for([true, false])('sourceMapsProd %s', (sourceMapsProd) => {
      it('should generate the expected files', async ({ expect }) => {
        await runSkuScriptInDir('build', appDir, {
          args: args[bundler],
          env: { SKU_SOURCE_MAPS_PROD: String(sourceMapsProd) },
        });

        const files = await dirContentsToObject(`${appDir}/dist`);

        expect(files).toMatchSnapshot();
      });
    });
  });
});
