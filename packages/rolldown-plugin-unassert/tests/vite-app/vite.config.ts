import { unassert } from '@sku-lib/rolldown-plugin-unassert';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    unassert({
      variables: ['assert', 'invariant'],
      modules: ['assert', 'node:assert', 'power-assert', 'tiny-invariant'],
    }),
  ],
  build: {
    minify: false,
  },
});
