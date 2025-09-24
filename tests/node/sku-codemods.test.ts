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
  // {
  //   filename: 'customNameFixture.tsx',
  //   codemodName: 'transform-vite-loadable',
  //   input: ts /* ts */ `
  //     import customLoadable from "sku/@loadable/component";

  //     const LoadableComponent = customLoadable(() => import('./MyComponent'));`,
  //   output: ts /* ts */ `
  //     import { loadable as customLoadable } from '@sku-lib/vite/loadable';

  //     const LoadableComponent = customLoadable(() => import('./MyComponent'));`,
  // },
  // {
  //   filename: 'loadableNameFixture.tsx',
  //   codemodName: 'transform-vite-loadable',
  //   input: ts /* ts */ `
  //     import loadable from 'sku/@loadable/component';

  //     const LoadableComponent = loadable(() => import('./MyComponent'));`,
  //   output: ts /* ts */ `
  //     import { loadable } from '@sku-lib/vite/loadable';

  //     const LoadableComponent = loadable(() => import('./MyComponent'));`,
  // },
  // {
  //   filename: 'onlyNamedImportFixture.tsx',
  //   codemodName: 'transform-vite-loadable',
  //   input: ts /* ts */ `
  //     import { loadableReady } from 'sku/@loadable/component';

  //     loadableReady();`,
  //   output: ts /* ts */ `
  //     import { loadableReady } from 'sku/@loadable/component';

  //     loadableReady();`,
  // },
  // {
  //   filename: 'mixedImportFixture.tsx',
  //   codemodName: 'transform-vite-loadable',
  //   input: ts /* ts */ `
  //     import { loadableReady } from 'sku/@loadable/component';
  //     import loadable from 'sku/@loadable/component';

  //     loadable();

  //     loadableReady();`,
  //   output: ts /* ts */ `
  //     import { loadableReady } from 'sku/@loadable/component';
  //     import { loadable } from '@sku-lib/vite/loadable';

  //     loadable();

  //     loadableReady();`,
  // },
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
  // {
  //   filename: 'chainedTestMethods.test.ts',
  //   codemodName: 'jest-to-vitest',
  //   input: ts /* ts */ `
  //     test.only("foo")
  //     describe.skip.each("foo")
  //     it.skip.each("foo")
  //   `,
  //   output: ts /* ts */ `
  //     import { describe, it, test } from 'vitest';
  //     test.only("foo")
  //     describe.skip.each("foo")
  //     it.skip.each("foo")
  //   `,
  // },
  // {
  //   filename: 'chainedTestMethods.test.ts',
  //   codemodName: 'jest-to-vitest',
  //   input: ts /* ts */ `
  //     test.only("foo")
  //     describe.skip.each("foo")
  //     it.skip.each("foo")

  //     test.failing("foo")
  //     test.failing.each("foo")
  //     it.skip.failing("foo")
  //     it.only.failing("foo")
  //   `,
  //   output: ts /* ts */ `
  //     import { describe, it, test } from 'vitest';
  //     test.only("foo")
  //     describe.skip.each("foo")
  //     it.skip.each("foo")

  //     test.fails("foo")
  //     test.fails.each("foo")
  //     it.skip.fails("foo")
  //     it.only.fails("foo")
  //   `,
  // },
  // {
  //   filename: 'existingVitestImport.test.ts',
  //   codemodName: 'jest-to-vitest',
  //   input: ts /* ts */ `
  //     import { test, vi } from 'vitest';
  //     test("foo")
  //     it("foo")
  //     describe("foo")
  //     vi.mock('foo')
  //   `,
  //   output: ts /* ts */ `
  //     import { describe, it, test, vi } from 'vitest';
  //     test("foo")
  //     it("foo")
  //     describe("foo")
  //     vi.mock('foo')
  //   `,
  // },
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

      it.only('Should transform files and match expected output', async () => {
        const cli = await codemod(codemodName, ['.']);

        expect(await cli.findByText('Changed files')).toBeInTheConsole();

        cli.debug();

        const fileContent = await fs.readFile(
          fixture.getPath(filename),
          'utf-8',
        );

        expect(fileContent).toEqual(output);
      });
    },
  );
});
