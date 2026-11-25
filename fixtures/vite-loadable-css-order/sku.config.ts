import type { SkuConfig } from 'sku';

export default {
  routes: [
    {
      name: 'home',
      route: '/',
    },
    { name: 'details', route: '/details/:id' },
  ],
} satisfies SkuConfig;
