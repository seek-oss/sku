import { createRequire } from 'node:module';
import type { PluginOption } from 'vite';
import type { SkuContext } from '../../../context/createSkuContext.js';
import { fixViteVanillaExtractDepScanPlugin } from './esbuild/fixViteVanillaExtractDepScanPlugin.js';
import { makePluginName } from '../helpers/makePluginName.js';

const require = createRequire(import.meta.url);

const getVocabViteAliases = (): Record<string, string> =>
  // Resolve against sku’s dependency tree, not the app’s — force injected
  // `@vocab/vite/runtime` imports (including from `.vocab` / compilePackages) onto sku’s copy.
  // Prefer the export file only; do not alias the package root (breaks `@vocab/vite/chunks` via exports).
  ({
    '@vocab/vite/runtime': require.resolve('@vocab/vite/runtime'),
  });

export const configPlugin = ({
  skuContext,
}: {
  skuContext: SkuContext;
}): PluginOption => ({
  name: makePluginName('config'),
  config: () => ({
    // SSR does not support the copied-as-is public assets folder.
    publicDir: skuContext.buildType === 'ssr' ? false : skuContext.paths.public,
    root: process.cwd(),
    resolve: {
      alias: {
        __sku_alias__clientEntry: skuContext.paths.clientEntry,
        __sku_alias__serverEntry: skuContext.paths.serverEntry,
        __sku_alias__renderEntry: skuContext.paths.renderEntry,
        ...(skuContext.languages ? getVocabViteAliases() : {}),
      },
    },
    define: {
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
    },
    optimizeDeps: {
      rolldownOptions: {
        plugins: [fixViteVanillaExtractDepScanPlugin()],
      },
      exclude: skuContext.skipPackageCompatibilityCompilation,
    },
    ssr: {
      external: ['serialize-javascript', '@sku-lib/vite'],
    },
  }),
});
