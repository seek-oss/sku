import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockSelect = vi.hoisted(() => vi.fn());
const mockMultiselect = vi.hoisted(() => vi.fn());
const mockPath = vi.hoisted(() => vi.fn());

vi.mock('@clack/prompts', async (importOriginal) => {
  const mod = (await importOriginal()) as Record<string, unknown>;
  return {
    ...mod,
    select: mockSelect,
    multiselect: mockMultiselect,
    path: mockPath,
  };
});

import {
  assertClackSubmittedString,
  chooseInteractiveTransformerPaths,
  getInteractiveRootCodemodSlugs,
  getTargetDirectoryFromPrompt,
  transformerPathsForJestSubsteps,
} from './interactive-selection.js';

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

describe('assertClackSubmittedString', () => {
  it('accepts string values', () => {
    expect(() => assertClackSubmittedString('.')).not.toThrow();
  });

  it('invokes process.exit for non-string values', () => {
    const exit = vi.spyOn(process, 'exit').mockImplementation((code) => {
      void code;
      throw new Error('exit');
    });
    expect(() => assertClackSubmittedString(Symbol('x'))).toThrow('exit');
    exit.mockRestore();
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

describe('chooseInteractiveTransformerPaths (mocked Clack)', () => {
  beforeEach(() => {
    mockSelect.mockReset();
    mockMultiselect.mockReset();
    mockPath.mockReset();
  });

  it('returns one module URL when user picks a non-jest root codemod', async () => {
    mockSelect.mockResolvedValueOnce('svg-import-query-param');
    const paths = await chooseInteractiveTransformerPaths();
    expect(paths).toHaveLength(1);
    expect(paths[0]).toContain('svg-import-query-param');
    expect(mockSelect).toHaveBeenCalledTimes(1);
    expect(mockMultiselect).not.toHaveBeenCalled();
  });

  it('returns full jest-to-vitest pipeline when user runs full migration', async () => {
    mockSelect.mockResolvedValueOnce('jest-to-vitest');
    mockSelect.mockResolvedValueOnce('full');
    const paths = await chooseInteractiveTransformerPaths();
    expect(paths).toHaveLength(1);
    expect(paths[0]).toContain('jest-to-vitest.mjs');
    expect(mockSelect).toHaveBeenCalledTimes(2);
    expect(mockMultiselect).not.toHaveBeenCalled();
  });

  it('returns ordered substep module URLs when user chooses specific steps', async () => {
    mockSelect.mockResolvedValueOnce('jest-to-vitest');
    mockSelect.mockResolvedValueOnce('steps');
    mockMultiselect.mockResolvedValueOnce([
      'jest-to-vitest-hooks',
      'jest-to-vitest-mock-types',
    ]);
    const paths = await chooseInteractiveTransformerPaths();
    expect(paths.map((u) => u.split('/').pop())).toEqual([
      'jest-to-vitest-mock-types.mjs',
      'jest-to-vitest-hooks.mjs',
      'jest-to-vitest-imports.mjs',
    ]);
    expect(mockMultiselect).toHaveBeenCalledTimes(1);
  });
});

describe('getTargetDirectoryFromPrompt (mocked Clack)', () => {
  beforeEach(() => {
    mockSelect.mockReset();
    mockMultiselect.mockReset();
    mockPath.mockReset();
  });

  it('returns the path string from the path prompt', async () => {
    mockPath.mockResolvedValueOnce('./fixtures');
    await expect(getTargetDirectoryFromPrompt()).resolves.toBe('./fixtures');
    expect(mockPath).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining('directory'),
        directory: true,
      }),
    );
  });
});
