import type { SkuConfig } from 'sku';

export default {
  bundler: 'vite',
  renderType: 'server-side-rendered',
  port: 8200,
  target: 'dist',
  languages: ['en', 'fr'],
  cspEnabled: true,
  cspExtraScriptSrcHosts: ['https://cdn.example.com'],
  cspReportOnlyEnabled: true,
  cspReportOnlyExtraScriptSrcHosts: ['https://report-only.example.com'],
  cspReportOnlyReportTo: 'csp-endpoint',
} satisfies SkuConfig;
