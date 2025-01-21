import type { SkuContext } from '@/context/createSkuContext.js';
import { viteServeSsrHandler } from '@/program/commands/serve-ssr/vite-serve-ssr-handler.js';
import { webpackServeSsrHandler } from '@/program/commands/serve-ssr/webpack-ssr-serve-handler.js';

const serveSsrAction = ({ skuContext }: { skuContext: SkuContext }) => {
  if (skuContext.skuConfig.bundler === 'vite') {
    viteServeSsrHandler({ skuContext });
  } else {
    webpackServeSsrHandler({ skuContext });
  }
};

export { serveSsrAction };
