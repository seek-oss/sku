import { type InlineConfig, mergeConfig } from 'vite';

import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';
import react from '@vitejs/plugin-react';

import type { SkuContext } from '../../../../context/createSkuContext.js';

import tsconfigPaths from 'vite-tsconfig-paths';
import { setNoExternalPlugin } from '../../plugins/setNoExternal.js';

const getVitestBaseConfig = (skuContext: SkuContext): InlineConfig => ({
  plugins: [
    tsconfigPaths(),
    react(),
    setNoExternalPlugin(skuContext),
    vanillaExtractPlugin(),
  ],
});

export const createSkuVitestConfig = (
  config: InlineConfig,
  skuContext: SkuContext,
) => mergeConfig(getVitestBaseConfig(skuContext), config);
