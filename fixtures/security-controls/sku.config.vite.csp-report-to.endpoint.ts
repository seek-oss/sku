import viteConfig from './sku.config.vite.ts';

export default {
  ...viteConfig,
  cspDelivery: 'header',
  cspReportTo: 'some-reporting-endpoint',
  cspReportOnlyEnabled: true,
  cspReportOnlyReportTo: 'some-report-only-reporting-endpoint',
};
