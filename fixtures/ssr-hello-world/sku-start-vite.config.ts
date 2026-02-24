// import { makeStableViteHashes } from '@sku-private/test-utils';
import type { SkuConfig } from 'sku';

/**
 * Config for testing sku start-ssr with Vite bundler.
 * Run with: sku start-ssr --config=sku-start-vite.config.ts
 */
export default {
  bundler: 'vite',
  port: 8100,
  serverPort: 8101,
  target: 'dist-start-vite',
  devServerMiddleware: './dev-middleware.cjs',
  cspEnabled: true,
  cspExtraScriptSrcHosts: ['https://some-cdn.com'],
  // dangerouslySetViteConfig: (config) => ({
  //   ...config,
  //   ...makeStableViteHashes(),
  // }),
} satisfies SkuConfig;
