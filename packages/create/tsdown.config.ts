import { defineConfig } from 'tsdown';
import { defaultConfig } from '@sku-private/tsdown';

export default defineConfig({
  ...defaultConfig,
  entry: ['src/cli.ts'],
  exports: false,
});
