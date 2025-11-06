import { defineConfig } from 'tsdown';

export default defineConfig({
  format: ['esm', 'cjs'],
  dts: true,
  exports: true,
  sourcemap: true,
  workspace: {
    include: ['packages/*'],
    exclude: ['packages/pnpm-plugin'],
  },
});
