import type { SkuConfig } from 'sku';

export default {
  bundler: 'vite',
  buildType: 'ssr',
  port: 8200,
  target: 'dist',
  languages: ['en', 'fr'],
  cspEnabled: true,
  cspExtraScriptSrcHosts: ['https://cdn.example.com'],
  cspReportOnlyEnabled: true,
  cspReportOnlyExtraScriptSrcHosts: ['https://report-only.example.com'],
  cspReportOnlyReportTo: 'csp-endpoint',
  // Local mocks only — mounted in `sku start`, never in the production server.
  devServerMiddleware: './dev-middleware.js',
} satisfies SkuConfig;
