import type { SkuConfig } from 'sku';

export default {
  bundler: 'vite',
  buildType: 'ssr',
  publicPath: '/static/ssr-document/',
  port: 8200,
  target: 'dist',
  csp: {
    enforced: {
      extraSources: {
        'script-src': ['https://cdn.example.com'],
        'connect-src': ['https://browser-intake-datadoghq.com'],
      },
      reportTo: 'https://report.example.com/csp',
    },
    reportOnly: {
      extraSources: {
        'script-src': ['https://report-only.example.com'],
        'frame-src': ['https://www.youtube.com'],
      },
      reportTo: 'https://report.example.com/csp-report-only',
    },
  },
} satisfies SkuConfig;
