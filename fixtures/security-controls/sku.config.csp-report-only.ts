import baseConfig from './sku.config.ts';

export default {
  ...baseConfig,
  cspReportOnlyEnabled: true,
  cspReportOnlyExtraScriptSrcHosts: ['https://some-report-only-cdn.com'],
};
