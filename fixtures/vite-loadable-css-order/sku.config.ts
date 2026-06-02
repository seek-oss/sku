import type { SkuConfig } from 'sku';

export default {
  bundler: 'vite',
  routes: [
    {
      name: 'home',
      route: '/',
    },
    { name: 'details', route: '/details/:id' },
  ],
} satisfies SkuConfig;
