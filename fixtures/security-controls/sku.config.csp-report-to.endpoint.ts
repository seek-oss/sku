import baseConfig from './sku.config.ts';

export default {
  ...baseConfig,
  cspDelivery: 'header',
  cspReportTo: 'some-reporting-endpoint',
  cspReportOnlyEnabled: true,
  cspReportOnlyReportTo: 'some-report-only-reporting-endpoint',
};
