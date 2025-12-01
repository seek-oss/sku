import { defineConfig } from 'tsdown';
import { defaultConfig } from '@sku-private/tsdown';

export default defineConfig({
  ...defaultConfig,
  // Need to use unbundled mode because `webpack/entry/server/index.ts` calls webpackHot.accept which needs the server app to be a different file.
  unbundle: true,
  entry: {
    index: 'src/index.ts',
    '@loadable/component': 'src/@loadable/component/index.ts',
    'bin/sku': 'src/bin/sku.ts',
    'config/eslint': 'src/config/eslint/config.ts',
    'config/prettier': 'src/config/prettier.ts',
    'config/storybook': 'src/config/storybook/config.cjs',
    'entries/vite-client': 'src/services/vite/entries/vite-client.tsx',
    'entries/vite-render': 'src/services/vite/entries/vite-render.tsx',
    'jest-preset': 'src/config/jest/preset.ts',
    'jest/file-mock': 'src/config/jest/fileMock.cjs',
    'jest/js-transform': 'src/config/jest/jsBabelTransform.ts',
    'jest/ts-transform': 'src/config/jest/tsBabelTransform.ts',
    'vite/client': 'src/services/vite/index.ts',
    'vite/prerender-worker':
      'src/services/vite/helpers/prerender/prerenderWorker.ts',
    'webpack-plugin': 'src/services/webpack/config/plugins/skuWebpackPlugin.ts',
    'webpack/client': 'src/services/webpack/entry/client/index.ts',
    'webpack/library-render':
      'src/services/webpack/entry/libraryRender/index.ts',
    'webpack/render': 'src/services/webpack/entry/render/index.ts',
    'webpack/server': 'src/services/webpack/entry/server/index.ts',
  },
  external: [
    '__sku_alias__renderEntry',
    '__sku_alias__clientEntry',
    '__sku_alias__serverEntry',
    '__sku_alias__webpackStats',
    'virtual:sku/polyfills',
  ],
});
