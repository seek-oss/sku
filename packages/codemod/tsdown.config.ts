import { defineConfig } from 'tsdown';
import { defaultConfig } from '@sku-private/tsdown';

export default defineConfig({
  ...defaultConfig,
  entry: ['src/program/index.ts', 'src/transform/worker.ts', 'src/codemods/*'],
});
