import { defineConfig } from 'tsdown';
import { defaultConfig } from '@sku-private/tsdown';

export default defineConfig({
  ...defaultConfig,
  entry: {
    loadable: 'src/loadable/index.ts',
    collector: 'src/loadable/collector.ts',
  },
});
