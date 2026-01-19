import { defineConfig } from 'tsdown';
import { defaultConfig } from '@sku-private/tsdown';

export default defineConfig({
  ...defaultConfig,
  dts: false,
  entry: ['src/program/index.ts', 'src/transform/worker.ts', 'src/codemods/*'],
});
