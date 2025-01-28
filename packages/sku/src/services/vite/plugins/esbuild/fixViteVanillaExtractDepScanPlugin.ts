import type { Plugin } from 'esbuild';
import { cssFileFilter } from '@vanilla-extract/integration';
import resolveFrom from 'resolve-from';
import { dirname } from 'node:path';

export const fixViteVanillaExtractDepScanPlugin = (): Plugin => ({
  name: 'fix-vite-vanilla-extract-dep-scan',
  setup(build) {
    build.onResolve({ filter: cssFileFilter }, async ({ importer, path }) => ({
      path: resolveFrom(dirname(importer), path),
      external: true,
    }));
  },
});
