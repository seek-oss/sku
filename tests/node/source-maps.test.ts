import { describe, it, expect } from 'vitest';

import { dirContentsToObject } from '@sku-private/test-utils';
import {
  bundlers,
  type BundlerValues,
  scopeToFixture,
} from '@sku-private/testing-library';

const { sku, fixturePath } = scopeToFixture('source-maps');

describe('source-maps', () => {
  const args: BundlerValues<string[]> = {
    vite: ['--config', 'sku.config.vite.ts'],
    webpack: [],
  };

  describe.each(bundlers)('bundler %s', (bundler) => {
    describe.for([true, false])('sourceMapsProd %s', (sourceMapsProd) => {
      it('should generate the expected files', async () => {
        const build = await sku('build', args[bundler], {
          spawnOpts: {
            env: {
              ...process.env,
              SKU_SOURCE_MAPS_PROD: String(sourceMapsProd),
            },
          },
        });
        expect(await build.findByText('Sku build complete')).toBeInTheConsole();

        const files = await dirContentsToObject(fixturePath('./dist'));
        expect(files).toMatchSnapshot();
      });
    });
  });
});
