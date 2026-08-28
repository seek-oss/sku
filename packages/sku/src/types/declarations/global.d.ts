declare module '__sku_alias__serverEntry';
declare module '__sku_alias__clientEntry';
declare module '__sku_alias__routesEntry';
declare module '__sku_alias__libraryEntry';
declare module '__sku_alias__renderEntry';
declare module '__sku_alias__webpackStats';
declare module 'virtual:sku/polyfills';

declare const __SKU_DEFAULT_SERVER_PORT__: string;

declare const __SKU_PUBLIC_PATH__: string;
declare const __SKU_CLIENT_PATH__: string;

/** Config site names for SSR per-site route tree pre-build. */
declare const __SKU_SITES__: string[];

declare const __SKU_CSP__: SkuCSP;

declare const __SKU_EXPRESS_TRUST_PROXY__: boolean;

declare const __SKU_DEV_MIDDLEWARE_PATH__: string;
declare const __SKU_DEV_MIDDLEWARE_ENABLED__: boolean;
declare const __SKU_DEV_HTTPS__: boolean;

declare const __SKU_LIBRARY_NAME__: string;
declare const __SKU_LIBRARY_FILE__: string;

/** Mirrors `ReportingEndpoint` from `utils/csp.ts`; this file must stay ambient, so it cannot import. */
type SkuReportingEndpoint = { endpoint: string; url?: string };

type SkuCSP = {
  enabled: boolean;
  extraHosts: string[];
  /** SSR `report-to` reporting endpoint (optional; unused by webpack SSR). */
  reportTo?: SkuReportingEndpoint;
  /** SSR Report-Only CSP (optional; unused by webpack SSR). */
  reportOnlyEnabled?: boolean;
  reportOnlyExtraHosts?: string[];
  reportOnlyReportTo?: SkuReportingEndpoint;
};
