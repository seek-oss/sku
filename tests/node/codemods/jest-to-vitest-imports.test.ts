import ts from 'dedent';
import { runCodemodTests } from '@sku-private/testing-library/codemod';

runCodemodTests('jest-to-vitest-imports', [
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
    filename: 'allGlobals.test.ts',
    input: ts /* ts */ `
      beforeAll(() => {});
      beforeEach(() => {});
      afterAll(() => {});
      afterEach(() => {});

      describe('suite', () => {
        it('should pass', () => {
          expect(true).toBe(true);
        });

        test('should also pass', () => {
          expect(false).not.toBe(true);
        });
      });

      vi.mock('./module');
    `,
    output: ts /* ts */ `
      import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, test, vi } from 'vitest';
      beforeAll(() => {});
      beforeEach(() => {});
      afterAll(() => {});
      afterEach(() => {});

      describe('suite', () => {
        it('should pass', () => {
          expect(true).toBe(true);
        });

        test('should also pass', () => {
          expect(false).not.toBe(true);
        });
      });

      vi.mock('./module');
    `,
  },
  {
    filename: 'lifecycleHooksOnly.test.ts',
    input: ts /* ts */ `
      beforeAll(setup);
      beforeEach(reset);
      afterEach(teardown);
      afterAll(cleanup);
    `,
    output: ts /* ts */ `
      import { afterAll, afterEach, beforeAll, beforeEach } from 'vitest';
      beforeAll(setup);
      beforeEach(reset);
      afterEach(teardown);
      afterAll(cleanup);
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
  {
    filename: 'existingVitestImportWithHooks.test.ts',
    input: ts /* ts */ `
      import { describe, it } from 'vitest';
      beforeAll(() => {});
      afterEach(() => {});
      describe('s', () => {
        it('t', () => {
          expect(1).toBe(1);
        });
      });
    `,
    output: ts /* ts */ `
      import { afterEach, beforeAll, describe, expect, it } from 'vitest';
      beforeAll(() => {});
      afterEach(() => {});
      describe('s', () => {
        it('t', () => {
          expect(1).toBe(1);
        });
      });
    `,
  },
]);
