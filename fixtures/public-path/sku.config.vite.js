import { makeStableViteHashes } from '@sku-private/test-utils';
import Inspect from 'vite-plugin-inspect';

import baseConfig from './sku.config.js';

export default {
  ...baseConfig,
  bundler: 'vite',
  dangerouslySetViteConfig: makeStableViteHashes,
  vitePlugins: [Inspect()],
};
