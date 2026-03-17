import type { SkuContext } from '../../../../context/createSkuContext.js';
import { createRequire } from 'node:module';
import type { InlineConfig } from 'vite';
import { vitePluginVocab } from '@vocab/vite';
import { cjsInterop } from 'vite-plugin-cjs-interop';
import react from '@vitejs/plugin-react';
import babel from '@rolldown/plugin-babel';
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';
import { getVocabConfig } from '../../../vocab/config.js';
import { skuPlugin } from '../../skuPlugin.js';
import { cjsModuleRunnerPlugin } from '@vitejs/plugin-rsc/plugins/cjs';

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
      // This is needed because of an error in  @oxc-project/runtime importing cjs code causing "ReferenceError: module is not defined".
      // This plugin will transform CJS code to ESM during dev.
      // @see issue - https://github.com/vitejs/vite/pull/21822
      // @see plugin - https://github.com/vitejs/vite/issues/20726#issuecomment-3274141203
      cjsModuleRunnerPlugin(),
      /**
       * user added plugins
       */
      skuContext.vitePlugins,

      /**
       * vendor plugins
       */
      vocabConfig && vitePluginVocab({ vocabConfig }),
      cjsInterop({
        dependencies: skuContext.serveCjsInteropDependencies,
        apply: 'serve',
      }),
      cjsInterop({
        dependencies: skuContext.buildCjsInteropDependencies,
        apply: 'build',
      }),
      react(),
      babel({
        // turn this on for react-compiler support
        // presets: [reactCompilerPreset()],
        plugins: [
          require.resolve('babel-plugin-macros'),
          ...(isProductionBuild ? prodBabelPlugins : []),
        ],
      }),
      vanillaExtractPlugin(),
      /**
       * the sku plugin (only sku specific changes)
       */
      skuPlugin({ skuContext, environment }),
    ],
  };
};
