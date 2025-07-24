import { describe, it } from 'vitest';

import { dirContentsToObject } from '@sku-private/test-utils';
import {
  bundlers,
  type BundlerValues,
  scopeToFixture,
} from '@sku-private/testing-library';

const { render, joinPath } = scopeToFixture('source-maps');

describe('source-maps', () => {
  const args: BundlerValues<string[]> = {
    vite: ['--config', 'sku.config.vite.ts', '--experimental-bundler'],
    webpack: [],
  };

  describe.sequential.each(bundlers)('bundler %s', (bundler) => {
    describe.for([true, false])('sourceMapsProd %s', (sourceMapsProd) => {
      it('should generate the expected files', async ({ expect }) => {
        const build = await render('build', args[bundler], {
          spawnOpts: {
            env: {
              ...process.env,
              SKU_SOURCE_MAPS_PROD: String(sourceMapsProd),
            },
          },
        });
        expect(await build.findByText('Sku build complete')).toBeInTheConsole();

        const files = await dirContentsToObject(joinPath('./dist'));
        expect(files).toMatchSnapshot();
      });
    });
  });
});
