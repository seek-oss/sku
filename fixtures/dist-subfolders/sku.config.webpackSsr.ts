import type { SkuConfig } from 'sku';

export default {
  distSubfolders: true,
  clientEntry: 'src/ssrClient.tsx',
  serverEntry: 'src/server.tsx',
  publicPath: '/static/',
  serverPort: 8402,
} satisfies SkuConfig;
