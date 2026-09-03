import type { SkuConfig } from 'sku';

import baseConfig from './sku.config.base.js';

export default {
  ...baseConfig,
  bundler: 'vite',
  buildType: 'ssr',

  clientEntry: 'src/ssr/client.tsx',
  serverEntry: 'src/ssr/server.tsx',
  routesEntry: 'src/ssr/routes.tsx',

  entrySideEffects: ['braid-design-system/reset'],
  port: 8219,
} satisfies SkuConfig;
