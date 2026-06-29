import type { SkuConfig } from 'sku';

export default {
  bundler: 'vite',
  vitePlugins: [
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
  // Tests that `server.watch` overrides don't break the Vanilla Extract compiler's Vite server
  // during a build
  dangerouslySetViteConfig: () => ({
    server: {
      watch: {
        ignored: /src\/foo\//,
      },
    },
  }),
} satisfies SkuConfig;
