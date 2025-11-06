import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: {
    '@loadable/component': 'src/@loadable/component/index.ts',
    'bin/sku': 'src/bin/sku.ts',
    'config/eslint': 'src/config/eslint/config.ts',
    'config/prettier': 'src/config/prettier.ts',
    'config/storybook': 'src/config/storybook/config.cjs',
    'context/createSkuContext.js': 'src/context/createSkuContext.ts',
    index: 'src/index.ts',
    'jest-preset': 'src/config/jest/preset.ts',
    'utils/configureApp.js': 'src/utils/configureApp.ts',
    'vite/client': 'src/services/vite/index.ts',
    'webpack-plugin': 'src/services/webpack/config/plugins/skuWebpackPlugin.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  exports: true,
  sourcemap: true,
});

/**
 *  ".": {
 * "types": {
 * "import": "./dist/index.d.ts",
 * "require": "./dist/index.d.cts"
 * }
 * },
 * "./jest-preset": "./dist/config/jest/preset.js",
 * "./config/eslint": {
 * "types": "./dist/config/eslint/config.d.ts",
 * "default": "./dist/config/eslint/config.js"
 * },
 * "./config/storybook": {
 * "types": "./dist/config/storybook/config.d.ts",
 * "default": "./dist/config/storybook/config.cjs"
 * },
 * "./vite/client": {
 * "types": "./dist/services/vite/client.d.ts"
 * },
 * "./@loadable/component": "./src/@loadable/component/index.ts",
 * "./webpack-plugin": "./dist/services/webpack/config/plugins/skuWebpackPlugin.js",
 * "./package.json": "./package.json"
 */
