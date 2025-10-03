import type { SkuConfig } from 'sku';

export default {
  bundler: 'vite',
  clientEntry: 'src/client.tsx',
  renderEntry: 'src/render.tsx',
  pathAliases: { '@bad/*': './node_modules/some-package/*' },
} satisfies SkuConfig;
