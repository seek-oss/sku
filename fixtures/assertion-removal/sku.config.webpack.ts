import type { SkuConfig } from 'sku';

import baseConfig from './sku.config.ts';

export default {
  ...baseConfig,
  bundler: 'webpack',
  testRunner: 'jest',
  serverPort: 8011,
  setupTests: './jestSetup.js',
} satisfies SkuConfig;
