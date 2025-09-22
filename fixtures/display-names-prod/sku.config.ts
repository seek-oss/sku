import type { SkuConfig } from 'sku';

export default {
  clientEntry: 'src/client.tsx',
  renderEntry: 'src/render.tsx',
  displayNamesProd: true,
  port: 8200,
} satisfies SkuConfig;
