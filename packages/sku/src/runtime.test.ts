import { describe, expect, it } from 'vitest';

import * as runtime from './runtime.js';

const skuOnlySharedStateSymbols = [
  'SkuProvider',
  'InsertHtmlProvider',
  'createInsertHtmlQueue',
  'registerSiteRouteTree',
  'runWithSsrRequestContext',
] as const;

describe('sku/runtime public surface', () => {
  it('exports Managed Data Mode consumer APIs', () => {
    expect(runtime.defineServerEntry).toBeTypeOf('function');
    expect(runtime.defineClientEntry).toBeTypeOf('function');
    expect(runtime.createSkuContexts).toBeTypeOf('function');
    expect(runtime.useInsertHtml).toBeTypeOf('function');
    expect(runtime.usePreloadRoute).toBeTypeOf('function');
    expect(runtime.getCspNonce).toBeTypeOf('function');
  });

  it('does not export sku-only shared-state mounts', () => {
    for (const symbol of skuOnlySharedStateSymbols) {
      expect(runtime).not.toHaveProperty(symbol);
    }
  });
});
