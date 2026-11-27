import { makeStableViteHashes } from '@sku-private/test-utils';
import type { SkuConfig } from 'sku';

export default {
  clientEntry: 'src/client.tsx',
  renderEntry: 'src/render.tsx',
  port: 4001,
  target: 'custom-output-directory',
  dangerouslySetViteConfig: makeStableViteHashes,
} satisfies SkuConfig;
