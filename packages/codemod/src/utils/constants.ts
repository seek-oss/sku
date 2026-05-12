type Codemod = {
  description: string;
  value: string;
};

export const CODEMODS = [
  {
    description:
      'Transform all webpack loadable imports to Vite loadable imports',
    value: 'transform-vite-loadable',
  },
  {
    description: 'Convert Jest tests to Vitest (full pipeline)',
    value: 'jest-to-vitest',
  },
  {
    description:
      'convert `as jest.Mock`/`MockedFunction` casts to `vi.mocked()`',
    value: 'jest-to-vitest-mock-types',
  },
  {
    description: 'replace `jest.<method>` with `vi.<method>`',
    value: 'jest-to-vitest-jest-methods',
  },
  {
    description:
      'convert `jest.fn<R, P>()` generics to `vi.fn<(...args: P) => R>()`',
    value: 'jest-to-vitest-fn-generics',
  },
  {
    description:
      'replace `jest.setTimeout(t)` with `vi.setConfig({ testTimeout: t })`',
    value: 'jest-to-vitest-set-timeout',
  },
  {
    description: 'make mock factories async and use `await vi.importActual`',
    value: 'jest-to-vitest-mock-factories',
  },
  {
    description:
      'wrap function references passed to lifecycle hooks in arrow functions',
    value: 'jest-to-vitest-hooks',
  },
  {
    description: 'rename `.failing` test modifier to `.fails`',
    value: 'jest-to-vitest-failing',
  },
  {
    description:
      'rewrite `.resolves`/`.rejects` matcher generics with `satisfies`',
    value: 'jest-to-vitest-resolves-rejects-generics',
  },
  {
    description: 'synthesize the `import { ... } from "vitest"` statement',
    value: 'jest-to-vitest-imports',
  },
  {
    description: 'Add query params to SVG imports for compatibility with Vite',
    value: 'svg-import-query-param',
  },
  /* [add-sku-codemod-generator: codemod] */
] as const satisfies Codemod[];

export type CodemodName = (typeof CODEMODS)[number]['value'];

/** Granular jest-to-vitest steps in pipeline order (imports must run last). */
export const JEST_TO_VITEST_STEP_SLUGS = [
  'jest-to-vitest-mock-types',
  'jest-to-vitest-jest-methods',
  'jest-to-vitest-fn-generics',
  'jest-to-vitest-set-timeout',
  'jest-to-vitest-mock-factories',
  'jest-to-vitest-hooks',
  'jest-to-vitest-failing',
  'jest-to-vitest-resolves-rejects-generics',
  'jest-to-vitest-imports',
] as const satisfies readonly CodemodName[];
