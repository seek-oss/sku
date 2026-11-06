import type { SkuConfig } from 'sku';

export default {
  bundler: 'vite',
  buildType: 'ssr',
  publicPath: '/static/ssr-document/',
  port: 8200,
  target: 'dist',
  cspEnabled: true,
  cspExtraSources: {
    'script-src': ['https://cdn.example.com'],
    'connect-src': ['https://browser-intake-datadoghq.com'],
  },
  cspReportTo: ['csp-endpoint', 'https://report.example.com/csp'],
  cspReportOnlyEnabled: true,
  cspReportOnlyExtraSources: {
    'script-src': ['https://report-only.example.com'],
    'frame-src': ['https://www.youtube.com'],
  },
  cspReportOnlyReportTo: 'csp-report-only-endpoint',
} satisfies SkuConfig;
