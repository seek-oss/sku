import type { SkuConfig } from 'sku';

export default {
  distSubfolders: true,
  environments: ['staging', 'production'],
  routes: [{ route: '/', name: 'home' }, '/about'],
  publicPath: '/static/',
  cspEnabled: true,
  cspDelivery: 'header',
} satisfies SkuConfig;
