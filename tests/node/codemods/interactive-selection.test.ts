import { describe, it, expect } from 'vitest';

import {
  getInteractiveRootCodemodSlugs,
  transformerPathsForJestSubsteps,
} from '../../../packages/codemod/src/transform/interactive-selection.js';

describe('getInteractiveRootCodemodSlugs', () => {
  it('includes orchestrator and family slugs but not granular jest substeps', () => {
    const slugs = getInteractiveRootCodemodSlugs();
    expect(slugs).toStrictEqual([
      'transform-vite-loadable',
      'jest-to-vitest',
      'svg-import-query-param',
      'migrate-root-resolution',
    ]);
  });
});

describe('transformerPathsForJestSubsteps', () => {
  it('orders by canonical pipeline order, not selection order', () => {
    const paths = transformerPathsForJestSubsteps([
      'jest-to-vitest-hooks',
      'jest-to-vitest-mock-types',
    ]);
    expect(paths.map((u) => u.split('/').pop())).toStrictEqual([
      'jest-to-vitest-mock-types.mjs',
      'jest-to-vitest-hooks.mjs',
      'jest-to-vitest-imports.mjs',
    ]);
  });

  it('appends imports when another step is selected but imports is not', () => {
    const paths = transformerPathsForJestSubsteps(['jest-to-vitest-hooks']);
    expect(paths.map((u) => u.split('/').pop())).toStrictEqual([
      'jest-to-vitest-hooks.mjs',
      'jest-to-vitest-imports.mjs',
    ]);
  });

  it('does not duplicate imports when already selected', () => {
    const paths = transformerPathsForJestSubsteps([
      'jest-to-vitest-hooks',
      'jest-to-vitest-imports',
    ]);
    expect(paths.map((u) => u.split('/').pop())).toStrictEqual([
      'jest-to-vitest-hooks.mjs',
      'jest-to-vitest-imports.mjs',
    ]);
  });

  it('allows imports-only selection', () => {
    const paths = transformerPathsForJestSubsteps(['jest-to-vitest-imports']);
    expect(paths.map((u) => u.split('/').pop())).toStrictEqual([
      'jest-to-vitest-imports.mjs',
    ]);
  });
});
