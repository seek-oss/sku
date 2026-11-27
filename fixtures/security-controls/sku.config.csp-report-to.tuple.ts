import baseConfig from './sku.config.ts';

export default {
  ...baseConfig,
  cspDelivery: 'header',
  cspReportTo: ['some-reporting-endpoint', 'https://some-reporting-url.com'],
  cspReportOnlyEnabled: true,
  cspReportOnlyReportTo: [
    'some-report-only-reporting-endpoint',
    'https://some-report-only-reporting-url.com',
  ],
};
