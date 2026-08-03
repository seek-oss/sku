import viteConfig from './sku.config.vite.ts';

export default {
  ...viteConfig,
  cspDelivery: 'header',
  cspReportTo: 'https://some-reporting-url.com',
  cspReportOnlyEnabled: true,
  cspReportOnlyReportTo: 'https://some-report-only-reporting-url.com',
};
