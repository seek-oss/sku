import ts from 'dedent';
import { runCodemodTests } from '@sku-private/testing-library/codemod';

runCodemodTests('jest-to-vitest', 'jest-to-vitest mock-types', [
  {
    filename: 'example.test.tsx',
    input: ts /* ts */ `
      const foo = jest.fn();
      const bar = jest.fn((bar) => bar);

      beforeAll(() => {});
      afterAll(() => {});
      beforeEach(() => {});
      afterEach(() => {});

      jest.mock('./foo', () => {
        const originalModule = jest.requireActual('./foo');

        return {
          ...originalModule,
          foo: 'foo',
          bar: jest.fn(),
        };
      })

      jest.mock('./foo', function () {
        const originalModule = jest.requireActual('./foo');

        return {
          ...originalModule,
          foo: 'foo',
          bar: jest.fn(),
        };
      })

      jest.mock('./foo2', () => ({
          ...jest.requireActual('./foo2'),
          ...jest.requireActual('./foo3'),
          foo: 'foo',
          bar: jest.fn(),
          baz: () => {
            return 'baz';
          },
          qux: async () => {
            return 'qux';
          },
          wert: function () {
            return 'wert';
          },
          pulp: async function () {
            return 'pulp';
          },
        })
      );

      jest.mock('./foo4', async () => ({
          ...jest.requireActual('./foo4'),
          foo: 'foo',
          bar: jest.fn(),
        })
      );

      const standalone = jest.requireActual('standalone');

      const mockedFoo = foo as jest.Mock;
      const mockedFoo = foo as jest.Mock<any>;
      const mockedFoo = foo as jest.Mock<any, any, any>;
      const mockedFoo = foo as jest.MockedFunction;
      const mockedFoo = foo as jest.MockedFunction<typeof foo>;
      const mockedFoo = foo as jest.MockedFunction<typeof foo> & { otherProperty: any };

      describe("foo", () => {
        it("should foo", () => {
          expect("foo").toBe("foo");
        });
        test("should foo", () => {
          expect("foo").toBe("foo");
        })
      })`,
    output: ts /* ts */ `
      import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, test, vi } from 'vitest';
      const foo = vi.fn();
      const bar = vi.fn((bar) => bar);

      beforeAll(() => {});
      afterAll(() => {});
      beforeEach(() => {});
      afterEach(() => {});

      vi.mock('./foo', async () => {
        const originalModule = await vi.importActual('./foo');

        return {
          ...originalModule,
          foo: 'foo',
          bar: vi.fn(),
        };
      })

      vi.mock('./foo', async function () {
        const originalModule = await vi.importActual('./foo');

        return {
          ...originalModule,
          foo: 'foo',
          bar: vi.fn(),
        };
      })

      vi.mock('./foo2', async () => ({
          ...await vi.importActual('./foo2'),
          ...await vi.importActual('./foo3'),
          foo: 'foo',
          bar: vi.fn(),
          baz: () => {
            return 'baz';
          },
          qux: async () => {
            return 'qux';
          },
          wert: function () {
            return 'wert';
          },
          pulp: async function () {
            return 'pulp';
          },
        })
      );

      vi.mock('./foo4', async () => ({
          ...await vi.importActual('./foo4'),
          foo: 'foo',
          bar: vi.fn(),
        })
      );

      const standalone = await vi.importActual('standalone');

      const mockedFoo = vi.mocked(foo);
      const mockedFoo = vi.mocked(foo);
      const mockedFoo = vi.mocked(foo);
      const mockedFoo = vi.mocked(foo);
      const mockedFoo = vi.mocked(foo);
      const mockedFoo = vi.mocked(foo);

      describe("foo", () => {
        it("should foo", () => {
          expect("foo").toBe("foo");
        });
        test("should foo", () => {
          expect("foo").toBe("foo");
        })
      })`,
  },
]);
