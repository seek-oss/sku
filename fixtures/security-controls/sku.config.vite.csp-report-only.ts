import viteConfig from './sku.config.vite.ts';

export default {
  ...viteConfig,
  cspReportOnlyEnabled: true,
  cspReportOnlyExtraScriptSrcHosts: ['https://some-report-only-cdn.com'],
};
