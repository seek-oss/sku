import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/program/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  exports: false,
  sourcemap: true,
});
