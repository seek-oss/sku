import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: {
    loadable: 'src/loadable/index.ts',
    collector: 'src/loadable/collector.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  exports: true,
  sourcemap: true,
});
