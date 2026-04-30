import ts from 'dedent';
import { runCodemodTests } from '@sku-private/testing-library/codemod';

runCodemodTests('jest-to-vitest', 'jest-to-vitest set-timeout', [
  {
    filename: 'jest-setTimeout.test.ts',
    input: ts /* ts */ `
      describe('timeout tests', () => {
        beforeEach(() => {
          jest.setTimeout(10000);
        });

        it('should handle timeout', () => {
          jest.setTimeout(5_000);
          expect(true).toBe(true);
        });

        test('with variable timeout', () => {
          const timeout = 15000;
          jest.setTimeout(timeout);
          expect(true).toBe(true);
        });
      });
    `,
    output: ts /* ts */ `
      import { beforeEach, describe, expect, it, test, vi } from 'vitest';
      describe('timeout tests', () => {
        beforeEach(() => {
          vi.setConfig({ testTimeout: 10000 });
        });

        it('should handle timeout', () => {
          vi.setConfig({ testTimeout: 5_000 });
          expect(true).toBe(true);
        });

        test('with variable timeout', () => {
          const timeout = 15000;
          vi.setConfig({ testTimeout: timeout });
          expect(true).toBe(true);
        });
      });
    `,
  },
]);
