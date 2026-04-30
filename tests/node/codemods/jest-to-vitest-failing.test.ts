import ts from 'dedent';
import { runCodemodTests } from '@sku-private/testing-library/codemod';

runCodemodTests('jest-to-vitest', 'jest-to-vitest failing', [
  {
    filename: 'chainedTestMethodsWithFailing.test.ts',
    input: ts /* ts */ `
      test.only("foo")
      describe.skip.each("foo")
      it.skip.each("foo")

      test.failing("foo")
      test.failing.each("foo")
      it.skip.failing("foo")
      it.only.failing("foo")
    `,
    output: ts /* ts */ `
      import { describe, it, test } from 'vitest';
      test.only("foo")
      describe.skip.each("foo")
      it.skip.each("foo")

      test.fails("foo")
      test.fails.each("foo")
      it.skip.fails("foo")
      it.only.fails("foo")
    `,
  },
]);
