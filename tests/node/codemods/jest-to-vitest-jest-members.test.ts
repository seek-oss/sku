import ts from 'dedent';
import { runCodemodTests } from '@sku-private/testing-library/codemod';

runCodemodTests('jest-to-vitest', 'jest-to-vitest jest-members', [
  {
    filename: 'jest-fn-without-generics.test.ts',
    input: ts /* ts */ `
      const foo = jest.fn();
      const bar = jest.fn((arg) => arg);
      const baz = jest.fn(() => 'hello');
    `,
    output: ts /* ts */ `
      import { vi } from 'vitest';
      const foo = vi.fn();
      const bar = vi.fn((arg) => arg);
      const baz = vi.fn(() => 'hello');
    `,
  },
]);
