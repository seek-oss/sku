import { describe, it, expect } from 'vitest';

import {
  getInteractiveRootCodemodSlugs,
  transformerPathsForJestSubsteps,
} from '../../../packages/codemod/src/transform/interactive-selection.js';

describe('getInteractiveRootCodemodSlugs', () => {
  it('includes orchestrator and family slugs but not granular jest substeps', () => {
    const slugs = getInteractiveRootCodemodSlugs();
    expect(slugs).toContain('jest-to-vitest');
    expect(slugs).toContain('transform-vite-loadable');
    expect(slugs).toContain('svg-import-query-param');
    expect(slugs).not.toContain('jest-to-vitest-hooks');
    expect(slugs).not.toContain('jest-to-vitest-imports');
  });
});

describe('transformerPathsForJestSubsteps', () => {
  it('orders by canonical pipeline order, not selection order', () => {
    const paths = transformerPathsForJestSubsteps([
      'jest-to-vitest-hooks',
      'jest-to-vitest-mock-types',
    ]);
    expect(paths.map((u) => u.split('/').pop())).toEqual([
      'jest-to-vitest-mock-types.mjs',
      'jest-to-vitest-hooks.mjs',
      'jest-to-vitest-imports.mjs',
    ]);
  });

  it('appends imports when another step is selected but imports is not', () => {
    const paths = transformerPathsForJestSubsteps(['jest-to-vitest-hooks']);
    expect(paths).toHaveLength(2);
    expect(paths[0]).toContain('jest-to-vitest-hooks');
    expect(paths[1]).toContain('jest-to-vitest-imports');
  });

  it('does not duplicate imports when already selected', () => {
    const paths = transformerPathsForJestSubsteps([
      'jest-to-vitest-hooks',
      'jest-to-vitest-imports',
    ]);
    expect(paths).toHaveLength(2);
    expect(paths.map((u) => u.split('/').pop())).toEqual([
      'jest-to-vitest-hooks.mjs',
      'jest-to-vitest-imports.mjs',
    ]);
  });

  it('allows imports-only selection', () => {
    const paths = transformerPathsForJestSubsteps(['jest-to-vitest-imports']);
    expect(paths).toHaveLength(1);
    expect(paths[0]).toContain('jest-to-vitest-imports');
  });
});
