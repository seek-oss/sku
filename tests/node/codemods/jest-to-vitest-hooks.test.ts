import ts from 'dedent';
import { runCodemodTests } from '@sku-private/testing-library/codemod';

runCodemodTests('jest-to-vitest', 'jest-to-vitest hooks', [
  {
    filename: 'jestHooksWithFunctionReferences.test.ts',
    input: ts /* ts */ `
      const scoringService = {
        spy: () => console.log('spy called'),
        setup: () => console.log('setup'),
        nested: {
          method: () => console.log('nested method')
        }
      };

      const mockFunction = jest.fn();
      const globalSetup = () => console.log('global');

      // These should be transformed - function references
      beforeAll(scoringService.spy);
      beforeEach(mockFunction);
      afterAll(scoringService.setup);
      afterEach(scoringService.nested.method);

      // These should NOT be transformed - already function expressions
      beforeAll(() => {
        console.log('setup');
      });

      beforeEach(function() {
        console.log('before each');
      });

      afterAll(async () => {
        await cleanup();
      });

      describe('test suite with hooks', () => {
        beforeAll(globalSetup); // This should be transformed

        it('should work', () => {
          expect(true).toBe(true);
        });
      });
    `,
    output: ts /* ts */ `
      import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
      const scoringService = {
        spy: () => console.log('spy called'),
        setup: () => console.log('setup'),
        nested: {
          method: () => console.log('nested method')
        }
      };

      const mockFunction = vi.fn();
      const globalSetup = () => console.log('global');

      // These should be transformed - function references
      beforeAll(() => { scoringService.spy() });
      beforeEach(() => { mockFunction() });
      afterAll(() => { scoringService.setup() });
      afterEach(() => { scoringService.nested.method() });

      // These should NOT be transformed - already function expressions
      beforeAll(() => {
        console.log('setup');
      });

      beforeEach(function() {
        console.log('before each');
      });

      afterAll(async () => {
        await cleanup();
      });

      describe('test suite with hooks', () => {
        beforeAll(() => { globalSetup() }); // This should be transformed

        it('should work', () => {
          expect(true).toBe(true);
        });
      });
    `,
  },
]);
