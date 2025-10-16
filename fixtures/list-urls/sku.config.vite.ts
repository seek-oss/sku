import type { SkuConfig } from 'sku';
import config from './sku.config';

export default {
  ...config,
  bundler: 'vite',
} satisfies SkuConfig;
