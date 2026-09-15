import { defineConfig } from 'tsdown';
import { defaultConfig } from '@sku-private/tsdown';

export default defineConfig([
  {
    ...defaultConfig,
    dts: true,
    // Don't rewrite package.json exports - this package maintains them manually
    // so the codemod subpath exports aren't wiped when building the root entry.
    exports: false,
    entry: ['src/index.ts'],
  },
  {
    ...defaultConfig,
    dts: false,
    exports: false,
    entry: [
      'src/program/index.ts',
      'src/transform/worker.ts',
      'src/codemods/*',
    ],
  },
]);
