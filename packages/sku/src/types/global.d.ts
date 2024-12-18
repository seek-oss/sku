declare module '__sku_alias__serverEntry';
declare module '__sku_alias__clientEntry';
declare module '__sku_alias__libraryEntry';
declare module '__sku_alias__renderEntry';
declare module '__sku_alias__webpackStats';

declare const __SKU_DEFAULT_SERVER_PORT__: string;

declare const __SKU_PUBLIC_PATH__: string;
declare const __SKU_CLIENT_PATH__: string;

declare const __SKU_CSP__: SkuCSP;

declare const __SKU_DEV_MIDDLEWARE_PATH__: string;
declare const __SKU_DEV_MIDDLEWARE_ENABLED__: boolean;
declare const __SKU_DEV_HTTPS__: boolean;

declare const __SKU_LIBRARY_NAME__: string;
declare const __SKU_LIBRARY_FILE__: string;

type CSPHandler = {
  registerScript: (script: string) => void;
  createCSPTag: () => string;
  handleHtml: (html: string) => string;
};

type SkuCSP = {
  enabled: boolean;
  extraHosts: string[];
};
