import { mergeConfig } from 'vite';
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';
import { fixViteVanillaExtractDepScanPlugin } from '../../services/vite/plugins/esbuild/fixViteVanillaExtractDepScanPlugin.js';
import type { StorybookConfig } from '@storybook/react-vite';

type ViteFinal = NonNullable<StorybookConfig['viteFinal']>;

const nodeEnvByStorybookConfigType = {
  PRODUCTION: 'production',
  DEVELOPMENT: 'development',
} as const;

export const viteFinal: ViteFinal = (config, { configType }) => {
  const mode = configType
    ? nodeEnvByStorybookConfigType[configType]
    : undefined;

  // Vitest (and similar runners) set NODE_ENV=test. Vite then treats the
  // Storybook build as non-production (jsxDEV) while our define still inlines
  // NODE_ENV=production for the client, which breaks React.
  // This is necessary for sku's test suite, but shouldn't affect consumers.
  if (mode) {
    process.env.NODE_ENV = mode;
  }

  return mergeConfig(config, {
    plugins: [vanillaExtractPlugin()],
    define: {
      // Enables Playroom components (e.g. `Placeholder`) to be used in stories
      'globalThis.__IS_PLAYROOM_ENVIRONMENT__': JSON.stringify('clearly'),
      // Surfaces Braid dev-time assertions in Storybook
      ...(mode
        ? {
            'process.env.NODE_ENV': JSON.stringify(mode),
          }
        : {}),
    },
    optimizeDeps: {
      rolldownOptions: {
        plugins: [fixViteVanillaExtractDepScanPlugin()],
      },
    },
  });
};
