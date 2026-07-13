declare module '#sku-vite-ssr-client-entry' {
  // Ambient modules cannot use relative `import type` (TS2439); `import()` is required here.
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports -- see above
  const onHydrate: import('../ssr/types.js').SkuSsrClientEntry;
  export default onHydrate;
}
