import ts from 'dedent';
import { runCodemodTests } from '@sku-private/testing-library/codemod';

runCodemodTests('jest-to-vitest', 'jest-to-vitest imports', [
  {
    filename: 'chainedTestMethods.test.ts',
    input: ts /* ts */ `
      test.only("foo")
      describe.skip.each("foo")
      it.skip.each("foo")
    `,
    output: ts /* ts */ `
      import { describe, it, test } from 'vitest';
      test.only("foo")
      describe.skip.each("foo")
      it.skip.each("foo")
    `,
  },
  {
    filename: 'existingVitestImport.test.ts',
    input: ts /* ts */ `
      import { test, vi } from 'vitest';
      test("foo")
      it("foo")
      describe("foo")
      vi.mock('foo')
    `,
    output: ts /* ts */ `
      import { describe, it, test, vi } from 'vitest';
      test("foo")
      it("foo")
      describe("foo")
      vi.mock('foo')
    `,
  },
]);
