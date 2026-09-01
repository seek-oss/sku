import type { SkuConfig } from 'sku';

export default {
  bundler: 'vite',
  buildType: 'ssr',
  sites: [
    { name: 'seekAnz', host: 'au.seek.com.localhost' },
    { name: 'jobStreet', host: 'jobstreet.com.localhost' },
  ],
  clientEntry: 'src/ssr/client.tsx',
  serverEntry: 'src/ssr/server.tsx',
  routesEntry: 'src/ssr/routes.tsx',
  entrySideEffects: ['braid-design-system/reset'],
  publicPath: '/',
  port: 8219,
} satisfies SkuConfig;
