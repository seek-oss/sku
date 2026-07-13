declare module '#sku-vite-ssr-app' {
  // Ambient modules cannot use relative `import type` (TS2439); `import()` is required here.
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports -- see above
  const app: import('../ssr/types.js').SkuApp;
  export default app;
}
