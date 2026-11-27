import type { SkuConfig } from 'sku';

export default {
  port: 8222,
  serverEntry: 'src/server.tsx',
  hosts: ['localhost', 'seek.com.localhost', 'au.seek.com.localhost'],
} satisfies SkuConfig;
