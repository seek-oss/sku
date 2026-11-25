import { makeStableViteHashes } from '@sku-private/test-utils';
import type { SkuConfig } from 'sku';

export default {
  clientEntry: 'src/client.tsx',
  renderEntry: 'src/render.tsx',
  serverEntry: 'src/server.tsx',
  port: 8239,
  dangerouslySetViteConfig: makeStableViteHashes,
} satisfies SkuConfig;
