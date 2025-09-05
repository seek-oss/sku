import { describe, it } from 'vitest';
import fs from 'node:fs/promises';
import ts from 'dedent';
import { createFixture } from 'fs-fixture';
import { scopeToFixture } from '@sku-private/testing-library/codemod';
import { CODEMODS } from '../../packages/codemod/src/utils/constants.js';

type TestCase = {
  filename: string;
  input: string;
  output: string;
};

const transformViteLoadableTestCases: TestCase[] = [
  {
    filename: 'customNameFixture.tsx',
    input: ts /* ts */ `
      import customLoadable from "sku/@loadable/component";

      const LoadableComponent = customLoadable(() => import('./MyComponent'));`,
    output: ts /* ts */ `
      import { loadable as customLoadable } from '@sku-lib/vite/loadable';

      const LoadableComponent = customLoadable(() => import('./MyComponent'));`,
  },
  {
    filename: 'loadableNameFixture.tsx',
    input: ts /* ts */ `
      import loadable from 'sku/@loadable/component';

      const LoadableComponent = loadable(() => import('./MyComponent'));`,
    output: ts /* ts */ `
      import { loadable } from '@sku-lib/vite/loadable';

      const LoadableComponent = loadable(() => import('./MyComponent'));`,
  },
  {
    filename: 'onlyNamedImportFixture.tsx',
    input: ts /* ts */ `
      import { loadableReady } from 'sku/@loadable/component';

      loadableReady();`,
    output: ts /* ts */ `
      import { loadableReady } from 'sku/@loadable/component';

      loadableReady();`,
  },
  {
    filename: 'mixedImportFixture.tsx',
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
];

const jestToVitestTestCases: TestCase[] = [
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
        };
      })

      jest.mock('./foo', function () {
        const originalModule = jest.requireActual('./foo');

        return {
          ...originalModule,
          foo: 'foo',
        };
      })

      jest.mock('./foo2', () => ({
          ...jest.requireActual('./foo2'),
          ...jest.requireActual('./foo3'),
          foo: 'foo',
        })
      );

      const standalone = jest.requireActual('standalone');

      describe("foo", () => {
        it("should foo", () => {
          expect("foo").toBe("foo");
        });
        test("should foo", () => {
          expect("foo").toBe("foo");
        })
      })`,
    output: ts /* ts */ `
      import { afterAll, afterEach, beforeAll, beforeEach, describe, it, test, vi } from 'vitest';
      const foo = vi.fn();
      const bar = vi.fn((bar) => bar);

      beforeAll(() => {});
      afterAll(() => {});
      beforeEach(() => {});
      afterEach(() => {});

      vi.mock('./foo', async () => {
        const originalModule = (await vi.importActual('./foo'));

        return {
          ...originalModule,
          foo: 'foo',
        };
      })

      vi.mock('./foo', async function () {
        const originalModule = (await vi.importActual('./foo'));

        return {
          ...originalModule,
          foo: 'foo',
        };
      })

      vi.mock('./foo2', async () => ({
          ...(await vi.importActual('./foo2')),
          ...(await vi.importActual('./foo3')),
          foo: 'foo',
        })
      );

      const standalone = (await vi.importActual('standalone'));

      describe("foo", () => {
        it("should foo", () => {
          expect("foo").toBe("foo");
        });
        test("should foo", () => {
          expect("foo").toBe("foo");
        })
      })`,
  },
];

const codemods = CODEMODS.map(({ value }) => value);

describe('sku codemods', () => {
  describe.for(codemods)('"%s" codemod', async (codemodName) => {
    const testCasesForCodemod = {
      'transform-vite-loadable': transformViteLoadableTestCases,
      'jest-to-vitest': jestToVitestTestCases,
    };
    const testCases = testCasesForCodemod[codemodName];

    describe.for(testCases)(
      'File $filename',
      async ({ filename, input, output }) => {
        const fixture = await createFixture({
          [filename]: input,
        });

        const { codemod } = scopeToFixture(fixture.path);

        it.skip('"--dry" should not change any files', async ({ expect }) => {
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

        it('Should transform files and match expected output', async ({
          expect,
        }) => {
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
});
