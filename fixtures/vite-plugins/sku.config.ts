import type { SkuConfig } from 'sku';

export default {
  bundler: 'vite',
  __UNSTABLE_vitePlugins: [
    {
      name: 'custom-plugin-build-start',
      buildStart: () => {
        // eslint-disable-next-line no-console
        console.log('build started with vite plugin');
      },
    },
    {
      name: 'custom-plugin-build-end',
      configureServer: () => {
        // eslint-disable-next-line no-console
        console.log('configureServer with vite plugin');
      },
    },
  ],
} satisfies SkuConfig;
