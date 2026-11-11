import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('../../../services/eslint/runESLint.js', () => ({
  check: vi.fn(async () => ({ exitCode: 0 })),
}));
vi.mock('../../../services/prettier.js', () => ({
  check: vi.fn(async () => ({ exitCode: 0 })),
}));
vi.mock('../../../services/typescript/runTsc.js', () => ({
  runTsc: vi.fn(async () => ({ exitCode: 0 })),
}));
vi.mock('../../../services/vocab/runVocab.js', () => ({
  runVocabCompile: vi.fn(async () => {}),
  watchVocabCompile: vi.fn(async () => {}),
}));
vi.mock('../../../utils/configure.js', () => ({
  configureProject: vi.fn(async () => {}),
}));
vi.mock('../../../utils/pathAliasImports.js', () => ({
  checkPathAliasImports: vi.fn(async () => ({ exitCode: 0 })),
}));
vi.mock('../../../utils/duplicatePackages.js', () => ({
  checkDuplicatePackages: vi.fn(async () => ({ exitCode: 0 })),
}));

import { checkDuplicatePackages } from '../../../utils/duplicatePackages.js';

const { lintAction } = await import('./lint.action.js');
import type { SkuContext } from '../../../context/createSkuContext.js';

const skuContext = {
  pathAliases: {},
  paths: {
    compilePackages: async () => ['@seek/lib', 'braid-design-system'],
  },
} as unknown as SkuContext;

describe('lintAction duplicate package check', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('runs the duplicate package check on a full lint run', async () => {
    await lintAction([], { skuContext });

    expect(checkDuplicatePackages).toHaveBeenCalledTimes(1);
    expect(checkDuplicatePackages).toHaveBeenCalledWith({
      candidatePackages: ['@seek/lib', 'braid-design-system'],
    });
  });

  it('does not run the duplicate package check on a scoped lint run', async () => {
    await lintAction(['src/foo.ts'], { skuContext });

    expect(checkDuplicatePackages).not.toHaveBeenCalled();
  });
});
