import { defineConfig } from 'tsdown';

export default defineConfig({
  format: ['cjs', 'esm'],
  entry: ['src/index.ts', 'src/config.ts'],
  exports: true,
});
