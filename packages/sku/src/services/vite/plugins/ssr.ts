import type { Plugin } from 'vite';
import type { SkuContext } from '../../../context/createSkuContext.js';
import { makePluginName } from '../helpers/makePluginName.js';

export const ssrPlugin = (skuContext: SkuContext): Plugin => ({
  name: makePluginName('ssr'),
  config: () => ({
    resolve: {
      alias: {
        '#sku-vite-ssr-server-entry': skuContext.paths.serverEntry,
        '#sku-vite-ssr-client-entry': skuContext.paths.clientEntry,
      },
    },
    define: {
      'import.meta.env.SKU_SSR_PORT': JSON.stringify(
        String(skuContext.port.client),
      ),
      'import.meta.env.SKU_LANGUAGES': JSON.stringify(
        JSON.stringify((skuContext.languages ?? []).map(({ name }) => name)),
      ),
      'import.meta.env.SKU_CSP_ENABLED': JSON.stringify(
        String(skuContext.cspEnabled),
      ),
      'import.meta.env.SKU_CSP_EXTRA_SCRIPT_SRC_HOSTS': JSON.stringify(
        JSON.stringify(skuContext.cspExtraScriptSrcHosts),
      ),
      'import.meta.env.SKU_CSP_REPORT_ONLY_ENABLED': JSON.stringify(
        String(skuContext.cspReportOnlyEnabled),
      ),
      'import.meta.env.SKU_CSP_REPORT_ONLY_EXTRA_SCRIPT_SRC_HOSTS':
        JSON.stringify(
          JSON.stringify(skuContext.cspReportOnlyExtraScriptSrcHosts),
        ),
      'import.meta.env.SKU_CSP_REPORT_ONLY_REPORT_TO': JSON.stringify(
        skuContext.cspReportOnlyReportTo ?? '',
      ),
    },
  }),
});
