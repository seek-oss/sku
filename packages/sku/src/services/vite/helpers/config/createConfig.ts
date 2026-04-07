import type { SkuContext } from '../../../../context/createSkuContext.js';
import tsconfigPaths from 'vite-tsconfig-paths';
import { createRequire } from 'node:module';
import type { InlineConfig } from 'vite';
import { vitePluginVocab } from '@vocab/vite';
import { cjsInterop } from 'vite-plugin-cjs-interop';
import react from '@vitejs/plugin-react';
import babel from '@rolldown/plugin-babel';
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';
import { getVocabConfig } from '../../../vocab/config.js';
import { skuPlugin } from '../../skuPlugin.js';
import { pluginName as svgOptimizationPluginName } from '../../plugins/svgOptimization.js';

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

  const TSCONFIG_PLUGIN_NAME = 'sku-tsconfig-paths';
  const vanillaExtractCompilerPluginWhitelist = [
    TSCONFIG_PLUGIN_NAME,
    svgOptimizationPluginName,
    'vite-plugin-inspect',
  ];

  return {
    resolve: {
      // ! vite v8+ supports tsconfigPaths out of the box, however we need to use the vite-tsconfig-paths plugin instead for vitest v3 support.
      // ! Once we drop support for vitest v3, we can remove this plugin and use the built-in tsconfigPaths support.
      // ! This will need to be added at the top level so that vanilla-extract picks it up. VE doesn't inherit config options from plugins at the moment (unless whitelisting the entire plugin)
      // tsconfigPaths: true,
    },
    plugins: [
      /**
       * user added plugins
       */
      skuContext.vitePlugins,

      /**
       * vendor plugins
       */
      vocabConfig && vitePluginVocab({ vocabConfig }),
      {
        ...tsconfigPaths(),
        // This is a workaround to avoid the warning about the plugin being detected.
        name: TSCONFIG_PLUGIN_NAME,
      },
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
      vanillaExtractPlugin({
        // vite-tsconfig-paths is whitelisted by default, but since we are renaming it to avoid the vite warning we need to filter it manually.
        unstable_pluginFilter: ({ name }) =>
          vanillaExtractCompilerPluginWhitelist.includes(name),
      }),
      /**
       * the sku plugin (only sku specific changes)
       */
      skuPlugin({ skuContext, environment }),
    ],
  };
};
