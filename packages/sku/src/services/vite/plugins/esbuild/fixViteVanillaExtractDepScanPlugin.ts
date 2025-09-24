import type { Plugin } from 'esbuild';
import { cssFileFilter } from '@vanilla-extract/integration';
import { dirname } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

export const fixViteVanillaExtractDepScanPlugin = (): Plugin => ({
  name: 'fix-vite-vanilla-extract-dep-scan',
  setup(build) {
    build.onResolve({ filter: cssFileFilter }, ({ importer, path }) => ({
      path: require.resolve(path, { paths: [dirname(importer)] }),
      external: true,
    }));
  },
});
