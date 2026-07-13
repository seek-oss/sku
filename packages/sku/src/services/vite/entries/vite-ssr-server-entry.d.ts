declare module '#sku-vite-ssr-server-entry' {
  // Ambient modules cannot use relative `import type` (TS2439); `import()` is required here.
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports -- see above
  const onRequest: import('../ssr/types.js').SkuSsrServerEntry;
  export default onRequest;
}
