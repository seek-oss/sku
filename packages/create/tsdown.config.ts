import { defineConfig } from 'tsdown';
import { defaultConfig } from '@sku-private/tsdown';

export default defineConfig({
  ...defaultConfig,
  dts: false,
  entry: ['src/cli.ts'],
  exports: false,
});
