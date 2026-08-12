import { describe, expect, it } from 'vitest';

import {
  getViteOptimizeDepsExclude,
  SKU_VITE_OPTIMIZE_DEPS_EXCLUDE,
} from './config.js';

describe('SKU_VITE_OPTIMIZE_DEPS_EXCLUDE', () => {
  it('always includes sku and sku/runtime', () => {
    expect(SKU_VITE_OPTIMIZE_DEPS_EXCLUDE).toContain('sku');
    expect(SKU_VITE_OPTIMIZE_DEPS_EXCLUDE).toContain('sku/runtime');
  });
});

describe('getViteOptimizeDepsExclude', () => {
  it('includes sku and sku/runtime', () => {
    expect(getViteOptimizeDepsExclude([])).toEqual(
      expect.arrayContaining(['sku', 'sku/runtime']),
    );
  });

  it('appends skipPackageCompatibilityCompilation after sku excludes', () => {
    expect(getViteOptimizeDepsExclude(['trusted-pkg'])).toEqual([
      ...SKU_VITE_OPTIMIZE_DEPS_EXCLUDE,
      'trusted-pkg',
    ]);
  });
});
