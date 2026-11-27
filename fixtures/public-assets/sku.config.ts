import { makeStableViteHashes } from '@sku-private/test-utils';
import type { SkuConfig } from 'sku';

export default {
  clientEntry: 'src/viteClient.tsx',
  renderEntry: 'src/viteRender.tsx',
  public: 'assets',
  port: 4002,
  dangerouslySetViteConfig: makeStableViteHashes,
} satisfies SkuConfig;
