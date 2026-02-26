import type { SkuContext } from '../../../../context/createSkuContext.js';
import { createRequire } from 'node:module';
import { getPathFromCwd, requireFromCwd } from '@sku-private/utils';
import type { InlineConfig } from 'vite';
import { vitePluginVocab } from '@vocab/vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import { cjsInterop } from 'vite-plugin-cjs-interop';
import react from '@vitejs/plugin-react';
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';
import { getVocabConfig } from '../../../vocab/config.js';
import { skuPlugin } from '../../skuPlugin.js';
import { visualizer } from 'rollup-plugin-visualizer';

const require = createRequire(import.meta.url);

export const createConfig = (
  skuContext: SkuContext,
  environment?: string,
): InlineConfig => {
  const vocabConfig = getVocabConfig(skuContext);
  const isProductionBuild = process.env.NODE_ENV === 'production';

  // ? Review these babel plugins
  const prodBabelPlugins: Array<string | [string, object]> = [
    require.resolve('babel-plugin-transform-react-remove-prop-types'),
    require.resolve('@babel/plugin-transform-react-constant-elements'),
    [
      require.resolve('babel-plugin-unassert'),
      {
        variables: ['assert', 'invariant'],
        modules: ['assert', 'node:assert', 'tiny-invariant'],
      },
    ],
  ];

  if (skuContext.displayNamesProd) {
    prodBabelPlugins.push(
      require.resolve('@sku-lib/babel-plugin-display-name'),
    );
  }

  return {
    plugins: [
      /**
       * user added plugins
       */
      skuContext.vitePlugins,

      /**
       * the sku plugin (only sku specific changes)
       */
      skuPlugin({ skuContext, environment }),

      /**
       * vendor plugins
       */
      vocabConfig && vitePluginVocab({ vocabConfig }),
      tsconfigPaths(),
      cjsInterop({
        dependencies: skuContext.cjsInteropDependencies,
      }),
      react({
        babel: {
          plugins: [
            require.resolve('babel-plugin-macros'),
            ...(isProductionBuild ? prodBabelPlugins : []),
          ],
        },
      }),
      vanillaExtractPlugin(),
      visualizer({
        filename: getPathFromCwd('report/client.html'),
        template: 'treemap',
        gzipSize: true,
        title: requireFromCwd('./package.json').name || 'Vite Bundle Analyzer',
      }),
    ],
  };
};
