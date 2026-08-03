import type { SkuConfig } from 'sku';

export default {
  bundler: 'vite',
  buildType: 'ssr',
  publicPath: '/static/vite-ssr/',
  port: 8200,
  target: 'dist',
  languages: ['en', 'fr'],
  sites: ['au', 'nz'],
  cspEnabled: true,
  cspExtraScriptSrcHosts: ['https://cdn.example.com'],
  cspReportTo: ['csp-endpoint', 'https://report.example.com/csp'],
  cspReportOnlyEnabled: true,
  cspReportOnlyExtraScriptSrcHosts: ['https://report-only.example.com'],
  cspReportOnlyReportTo: 'csp-report-only-endpoint',
  devServerMiddleware: './dev-middleware.js',
} satisfies SkuConfig;
