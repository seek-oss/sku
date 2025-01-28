import type { SkuContext } from '@/context/createSkuContext.js';

export const webpackServeSsrHandler = (_options: {
  skuContext: SkuContext;
}) => {
  console.log('Webpack does not support the start-ssr command');
};
