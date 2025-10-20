import type { SkuConfig } from 'sku';

export default {
  port: 8222,
  serverPort: 8223,
  serverEntry: 'src/server.tsx',
  hosts: ['localhost', 'local.seek.com', 'dev.seek.com.au'],
} satisfies SkuConfig;
