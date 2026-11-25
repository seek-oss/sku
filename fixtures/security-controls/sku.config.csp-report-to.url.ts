import baseConfig from './sku.config.ts';

export default {
  ...baseConfig,
  cspDelivery: 'header',
  cspReportTo: 'https://some-reporting-url.com',
  cspReportOnlyEnabled: true,
  cspReportOnlyReportTo: 'https://some-report-only-reporting-url.com',
};
