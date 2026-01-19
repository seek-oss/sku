import { describe, it, expect } from 'vitest';
import fs from 'node:fs/promises';
import ts from 'dedent';
import { createFixture } from 'fs-fixture';
import { scopeToFixture } from '@sku-private/testing-library/codemod';
import type { CodemodName } from '../../packages/codemod/src/utils/constants.js';

type TestCase = {
  filename: string;
  codemodName: CodemodName;
  input: string;
  output: string;
};

const testCases: TestCase[] = [
  {
    filename: 'customNameFixture.tsx',
    codemodName: 'transform-vite-loadable',
    input: ts /* ts */ `
      import customLoadable from "sku/@loadable/component";

      const LoadableComponent = customLoadable(() => import('./MyComponent'));`,
    output: ts /* ts */ `
      import { loadable as customLoadable } from '@sku-lib/vite/loadable';

      const LoadableComponent = customLoadable(() => import('./MyComponent'));`,
  },
  {
    filename: 'loadableNameFixture.tsx',
    codemodName: 'transform-vite-loadable',
    input: ts /* ts */ `
      import loadable from 'sku/@loadable/component';

      const LoadableComponent = loadable(() => import('./MyComponent'));`,
    output: ts /* ts */ `
      import { loadable } from '@sku-lib/vite/loadable';

      const LoadableComponent = loadable(() => import('./MyComponent'));`,
  },
  {
    filename: 'onlyNamedImportFixture.tsx',
    codemodName: 'transform-vite-loadable',
    input: ts /* ts */ `
      import { loadableReady } from 'sku/@loadable/component';

      loadableReady();`,
    output: ts /* ts */ `
      import { loadableReady } from 'sku/@loadable/component';

      loadableReady();`,
  },
  {
    filename: 'mixedImportFixture.tsx',
    codemodName: 'transform-vite-loadable',
    input: ts /* ts */ `
      import { loadableReady } from 'sku/@loadable/component';
      import loadable from 'sku/@loadable/component';

      loadable();

      loadableReady();`,
    output: ts /* ts */ `
      import { loadableReady } from 'sku/@loadable/component';
      import { loadable } from '@sku-lib/vite/loadable';

      loadable();

      loadableReady();`,
  },
  {
    filename: 'example.test.tsx',
    codemodName: 'jest-to-vitest',
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
  {
    filename: 'chainedTestMethods.test.ts',
    codemodName: 'jest-to-vitest',
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
    filename: 'chainedTestMethods.test.ts',
    codemodName: 'jest-to-vitest',
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
  {
    filename: 'existingVitestImport.test.ts',
    codemodName: 'jest-to-vitest',
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
    filename: 'mock-defined-outside.test.ts',
    codemodName: 'jest-to-vitest',
    input: ts /* ts */ `
      import { test, vi } from 'vitest';
      const mock = () => ({
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
        blorp: () => {
          return jest.requireActual();
        },
        beep: function importMock() {
          return jest.requireActual();
        },
      });

      jest.mock('./foo2', mock);
    `,
    output: ts /* ts */ `
    import { test, vi } from 'vitest';
    const mock = async () => ({
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
      blorp: async () => {
        return await vi.importActual();
      },
      beep: async function importMock() {
        return await vi.importActual();
      },
    });

    vi.mock('./foo2', mock);
    `,
  },
  {
    filename: 'genericExpects.test.ts',
    codemodName: 'jest-to-vitest',
    input: ts /* ts */ `
      interface MyType {
        id: number;
        name: string;
      }

      it('should handle generic expects', async () => {
        const result = Promise.resolve({ id: 1, name: 'test' });
        const error = new Error('test error');
        const stringValue = 'hello';
        const numberValue = 42;
        const objectValue = { key: 'value' };

        // Generic with resolves/rejects and objects (should be transformed)
        expect(result).resolves.toEqual<MyType>({});
        expect(result).resolves.toMatchObject<MyType>({ id: 1 });
        await expect(result).resolves.toStrictEqual<MyType>({ id: 1, name: 'test' });

        // Generic with longer chains including .not (should be transformed)
        expect(result).not.resolves.toEqual<MyType>({});
        expect(result).not.resolves.toMatchObject<MyType>({ id: 1 });
        expect(promise).not.rejects.toThrow<Error>(error);
        expect(result).resolves.not.toEqual<MyType>(wrongData);
        expect(promise).rejects.not.toBe<string>('error');

        // Generic with complex types (should be transformed)
        expect(rejectedPromise).rejects.toMatchObject<{ error: string }>({ error: 'failed' });
        expect(rejectedPromise).rejects.toMatchObject<{ error: string, status: number }>({ error: 'failed', status: 500 });
        await expect(complexAsyncCall()).resolves.toStrictEqual<ComplexObject>({
          prop1: 'value1',
          nested: {
            prop2: 'value2',
            items: ['item1'],
          },
          prop3: expect.any(Object),
        });

        // Generic with regular expect chains (should remain unchanged)
        expect(stringValue).toBe<string>('hello');
        expect(numberValue).toEqual<number>(42);
        expect(objectValue).toMatchObject<{ key: string }>({ key: 'value' });

        // Generic with .not chains (should remain unchanged)
        expect(stringValue).not.toBe<string>('world');
        expect(numberValue).not.toEqual<number>(0);

        // Generic with variables and complex expressions (should remain unchanged)
        expect(getValue()).toEqual<MyType>(expectedValue);
        expect(processData(input)).toBe<string>(result.output);
      });
    `,
    output: ts /* ts */ `
      import { expect, it } from 'vitest';
      interface MyType {
        id: number;
        name: string;
      }

      it('should handle generic expects', async () => {
        const result = Promise.resolve({ id: 1, name: 'test' });
        const error = new Error('test error');
        const stringValue = 'hello';
        const numberValue = 42;
        const objectValue = { key: 'value' };

        // Generic with resolves/rejects and objects (should be transformed)
        expect(result).resolves.toEqual({} satisfies MyType);
        expect(result).resolves.toMatchObject({ id: 1 } satisfies MyType);
        await expect(result).resolves.toStrictEqual({ id: 1, name: 'test' } satisfies MyType);

        // Generic with longer chains including .not (should be transformed)
        expect(result).not.resolves.toEqual({} satisfies MyType);
        expect(result).not.resolves.toMatchObject({ id: 1 } satisfies MyType);
        expect(promise).not.rejects.toThrow(error satisfies Error);
        expect(result).resolves.not.toEqual(wrongData satisfies MyType);
        expect(promise).rejects.not.toBe('error' satisfies string);

        // Generic with complex types (should be transformed)
        expect(rejectedPromise).rejects.toMatchObject({ error: 'failed' } satisfies { error: string });
        expect(rejectedPromise).rejects.toMatchObject({ error: 'failed', status: 500 } satisfies { error: string, status: number });
        await expect(complexAsyncCall()).resolves.toStrictEqual({
          prop1: 'value1',
          nested: {
            prop2: 'value2',
            items: ['item1'],
          },
          prop3: expect.any(Object),
        } satisfies ComplexObject);

        // Generic with regular expect chains (should remain unchanged)
        expect(stringValue).toBe<string>('hello');
        expect(numberValue).toEqual<number>(42);
        expect(objectValue).toMatchObject<{ key: string }>({ key: 'value' });

        // Generic with .not chains (should remain unchanged)
        expect(stringValue).not.toBe<string>('world');
        expect(numberValue).not.toEqual<number>(0);

        // Generic with variables and complex expressions (should remain unchanged)
        expect(getValue()).toEqual<MyType>(expectedValue);
        expect(processData(input)).toBe<string>(result.output);
      });
    `,
  },
  {
    filename: 'jestHooksWithFunctionReferences.test.ts',
    codemodName: 'jest-to-vitest',
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
  {
    filename: 'jest-setTimeout.test.ts',
    codemodName: 'jest-to-vitest',
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
  {
    filename: 'jest-fn-with-generics.test.ts',
    codemodName: 'jest-to-vitest',
    input: ts /* ts */ `
      type Middleware = (req: Request, res: Response) => void;

      const middleware = jest.fn<void, Parameters<Middleware>>();
      const callback = jest.fn<string, [number, boolean]>();
      const handler = jest.fn<Promise<void>, [Context]>();
      export const resolveRoles = jest.fn<
        Promise<string[]> | string[],
        [ApolloContext]
      >();
    `,
    output: ts /* ts */ `
      import { vi } from 'vitest';
      type Middleware = (req: Request, res: Response) => void;

      const middleware = vi.fn<(...args: Parameters<Middleware>) => void>();
      const callback = vi.fn<(...args: [number, boolean]) => string>();
      const handler = vi.fn<(...args: [Context]) => Promise<void>>();
      export const resolveRoles = vi.fn<(...args: [ApolloContext]) => Promise<string[]> | string[]>();
    `,
  },
  {
    filename: 'jest-fn-without-generics.test.ts',
    codemodName: 'jest-to-vitest',
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
];

describe('sku codemods', () => {
  describe.for(testCases)(
    'Codemod $codemodName - File $filename',
    async ({ filename, codemodName, input, output }) => {
      const fixture = await createFixture({
        [filename]: input,
      });

      const { codemod } = scopeToFixture(fixture.path);

      it('"--dry" should not change any files', async () => {
        const cli = await codemod(codemodName, ['.', '--dry']);

        expect(
          await cli.findByText('files found that would be changed.'),
        ).toBeInTheConsole();

        const fileContent = await fs.readFile(
          fixture.getPath(filename),
          'utf-8',
        );

        expect(fileContent).toEqual(input);
      });

      it('Should transform files and match expected output', async () => {
        const cli = await codemod(codemodName, ['.']);

        expect(await cli.findByText('Changed files')).toBeInTheConsole();

        const fileContent = await fs.readFile(
          fixture.getPath(filename),
          'utf-8',
        );

        expect(fileContent).toEqual(output);
      });
    },
  );
});
