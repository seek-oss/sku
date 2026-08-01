import { describe, expect, it } from 'vitest';

import {
  getViteOptimizeDepsExclude,
  SKU_VITE_OPTIMIZE_DEPS_EXCLUDE,
} from './config.js';

describe('SKU_VITE_OPTIMIZE_DEPS_EXCLUDE', () => {
  it('always includes sku and sku/ssr', () => {
    expect(SKU_VITE_OPTIMIZE_DEPS_EXCLUDE).toContain('sku');
    expect(SKU_VITE_OPTIMIZE_DEPS_EXCLUDE).toContain('sku/ssr');
  });
});

describe('getViteOptimizeDepsExclude', () => {
  it('includes sku and sku/ssr', () => {
    expect(getViteOptimizeDepsExclude([])).toEqual(
      expect.arrayContaining(['sku', 'sku/ssr']),
    );
  });

  it('appends skipPackageCompatibilityCompilation after sku excludes', () => {
    expect(getViteOptimizeDepsExclude(['trusted-pkg'])).toEqual([
      ...SKU_VITE_OPTIMIZE_DEPS_EXCLUDE,
      'trusted-pkg',
    ]);
  });
});
