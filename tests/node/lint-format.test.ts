import { describe, it, beforeAll, expect } from 'vitest';
import path from 'node:path';
import dedent from 'dedent';
import {
  createFixture,
  scopeToFixture,
  type RenderResult,
  waitForExitCode,
  hasExpectedExitCode,
  waitFor,
} from '@sku-private/testing-library';

const { sku, fixturePath } = scopeToFixture('lint-format');

type Fixture = Awaited<ReturnType<typeof createFixture>>;

/**
 * Creates the throwaway source files inside the `lint-format` fixture so that
 * `sku lint`/`sku format` picks them
 */
const createSrcFixture = (files: Record<string, string>) =>
  createFixture(files, { tempDir: fixturePath() });

/** The fixture's location relative to the directory `sku` is run from. */
const relativePath = (fixture: Fixture, ...subpaths: string[]) =>
  path.relative(fixturePath(), fixture.getPath(...subpaths));

/**
 * A file that only fails the TypeScript check.
 * It is exported so that ESLint does not additionally flag it as an unused variable.
 */
const typeErrorFile = `export const notANumber: number = 'a string';\n`;

/**
 * A file that only fails the Prettier check.
 * It is exported so that neither TypeScript nor ESLint flag it.
 */
const prettierErrorFile = `export const badlyFormatted = "needs formatting"\n`;

/**
 * A file that only fails the ESLint check.
 * It is already correctly formatted so that Prettier does not flag it.
 */
const esLintErrorFile = `console.log('foo');

it.only('should test something', () => {
  let mutable = true;

  expect(mutable).toBe(true);
});
`;

/**
 * A file that passes every linter: valid types, correctly formatted and free of
 * lint errors.
 */
const passingFile = `export const greeting = 'hello world';\n`;

describe('lint-format', () => {
  describe('sku lint', () => {
    describe('when there are no lint errors', () => {
      let lint: RenderResult;

      beforeAll(async () => {
        const fixture = await createSrcFixture({
          'passing.ts': passingFile,
        });
        lint = await sku('lint');

        await waitForExitCode(lint, 0);
        fixture.rm();
      });

      it('should run every linter', async () => {
        expect(
          await lint.findByText('Checking code with TypeScript compiler'),
        ).toBeInTheConsole();
        expect(
          await lint.findByText('Checking code with Prettier'),
        ).toBeInTheConsole();
        expect(
          await lint.findByText('Checking code with ESLint'),
        ).toBeInTheConsole();
      });

      it('should exit with a zero exit code', () => {
        expect(hasExpectedExitCode(lint, 0)).toBe(true);
      });

      it('should report that linting is complete', async () => {
        expect(await lint.findByText('Linting complete')).toBeInTheConsole();
      });
    });

    describe('when every linter reports errors', () => {
      let lint: RenderResult;

      beforeAll(async () => {
        const fixture = await createSrcFixture({
          'typeError.ts': typeErrorFile,
          'prettierError.js': prettierErrorFile,
          'esLintError.test.ts': esLintErrorFile,
        });

        lint = await sku('lint');

        await waitForExitCode(lint, 1);
        fixture.rm();
      });

      it('should run every linter before failing', async () => {
        expect(
          await lint.findByText('Checking code with TypeScript compiler'),
        ).toBeInTheConsole();
        expect(
          await lint.findByText('Checking code with Prettier'),
        ).toBeInTheConsole();
        expect(
          await lint.findByText('Checking code with ESLint'),
        ).toBeInTheConsole();
      });

      it('should exit with a non-zero exit code', () => {
        expect(hasExpectedExitCode(lint, 1)).toBe(true);
      });

      it('should report that linting failed', async () => {
        expect(await lint.findByError('Linting failed')).toBeInTheConsole();
      });

      describe('TypeScript', () => {
        it('should report type errors', async () => {
          expect(
            await lint.findByText(
              `error TS2322: Type 'string' is not assignable to type 'number'.`,
            ),
          ).toBeInTheConsole();
          expect(await lint.findByText('typeError.ts')).toBeInTheConsole();
        });
      });

      describe('Prettier', () => {
        it('should report unformatted files', async () => {
          expect(
            await lint.findByError(
              'Error: The file(s) listed above failed the prettier check',
            ),
          ).toBeInTheConsole();
          expect(
            await lint.findByText("To fix this issue, run 'pnpm run format'"),
          ).toBeInTheConsole();
        });
      });

      describe('ESLint', () => {
        it('should report lint errors', async () => {
          expect(
            await lint.findByText('3 problems (3 errors, 0 warnings)'),
          ).toBeInTheConsole();
          expect(await lint.findByText('no-console')).toBeInTheConsole();
          expect(
            await lint.findByText('jest/no-focused-tests'),
          ).toBeInTheConsole();
        });
      });
    });

    describe('when file paths are provided', () => {
      let lint: RenderResult;
      let target: string;

      beforeAll(async () => {
        await using fixture = await createSrcFixture({
          'prettierError.js': prettierErrorFile,
        });
        target = relativePath(fixture, 'prettierError.js');

        lint = await sku('lint', [target]);

        await waitForExitCode(lint, 1);
      });

      it('should skip the TypeScript check', async () => {
        expect(
          await lint.findByText('Skipping TypeScript check'),
        ).toBeInTheConsole();
        expect(
          await lint.findByText(
            'Typescript checks are skipped when file paths are provided',
          ),
        ).toBeInTheConsole();

        expect(
          lint.queryByText('Checking code with TypeScript compiler'),
        ).not.toBeInTheConsole();
      });

      it('should still run Prettier and ESLint against the provided paths', async () => {
        expect(
          await lint.findByText('Checking code with Prettier'),
        ).toBeInTheConsole();
        expect(
          await lint.findByText('Checking code with ESLint'),
        ).toBeInTheConsole();
        expect(await lint.findByText(`Paths: ${target}`)).toBeInTheConsole();
      });
    });

    describe('when a path matches no files', () => {
      let lint: RenderResult;

      beforeAll(async () => {
        lint = await sku('lint', ['does-not-exist.js']);

        await waitForExitCode(lint, 1);
      });

      it('should skip the TypeScript check', async () => {
        expect(
          await lint.findByText('Skipping TypeScript check'),
        ).toBeInTheConsole();
      });

      it('should report that Prettier found no matching files', async () => {
        expect(
          await lint.findByError('No files matching the pattern were found'),
        ).toBeInTheConsole();
      });

      it('should report that ESLint found no matching files', async () => {
        expect(
          await lint.findByError(
            `No files matching 'does-not-exist.js' were found`,
          ),
        ).toBeInTheConsole();
      });

      it('should fail linting', async () => {
        expect(await lint.findByError('Linting failed')).toBeInTheConsole();
      });
    });

    describe('when Prettier cannot parse a file', () => {
      let lint: RenderResult;

      beforeAll(async () => {
        await using fixture = await createSrcFixture({
          'brokenSyntax.js': 'const x = (\n',
        });

        lint = await sku('lint', [relativePath(fixture, 'brokenSyntax.js')]);

        await waitForExitCode(lint, 1);
      });

      it('should skip the TypeScript check', async () => {
        expect(
          await lint.findByText('Skipping TypeScript check'),
        ).toBeInTheConsole();
      });

      it('should report a Prettier syntax error', async () => {
        expect(await lint.findByError('SyntaxError')).toBeInTheConsole();
      });

      it('should fail linting', async () => {
        expect(await lint.findByError('Linting failed')).toBeInTheConsole();
      });
    });

    describe('when the test runner is vitest', () => {
      let lint: RenderResult;

      beforeAll(async () => {
        await using fixture = await createSrcFixture({
          // only fails vitest rules (correctly formatted)
          'vitestRules.test.ts': dedent /* ts */ `
            import { it, expect } from 'vitest';
            console.log('foo');

            it.only('should test something', () => {
              let mutable = true;

              expect(mutable).toBe(true);
            });
          `,
        });

        lint = await sku('lint', ['--config', 'sku.config.vitest.ts']);

        await waitForExitCode(lint, 1);
        fixture.rm();
      });

      it('should use vitest lint rules', async () => {
        expect(
          await lint.findByText('Checking code with ESLint'),
        ).toBeInTheConsole();
        expect(
          await lint.findByText('vitest/no-focused-tests'),
        ).toBeInTheConsole();
        expect(
          await lint.findByText('3 problems (3 errors, 0 warnings)'),
        ).toBeInTheConsole();
      });
    });
  });

  describe('sku format', () => {
    expect.addSnapshotSerializer({
      serialize: (val) => val,
      test: (val) => typeof val === 'string',
    });

    const filesToFormat: Record<string, string> = {
      'importOrder1.ts': dedent /* ts */ `
        import './reset'; // side-effect imports should stay put

        import LocalComponent from './LocalComponent'; // sibling
        import Parent from '../parent'; // parents
        import someModule from 'some-module'; // external
        import vanillaStyles from './vanillaStyles.css'; // styles
        import distantParent from '../../../parent'; // parents
        import myself from '.'; // index
        import path from 'path'; //  built-in
        import utils from '#src/utils'; // internal
      `,
      'importOrder2.ts': dedent /* ts */ `
        import aStyle from './a.css';
        import bStyle from './b.css';
        import cStyle from '../c.css';

        import b from './b';
        import a from './a';
        import c from '../c';
      `,
      'fixableLintError.ts': dedent /* ts */ `
        const foo = () => {
          return 'foo';
        };
      `,
      'unformattedFile2.ts': dedent /* ts */ `
        import { something } from "with-double-quotes";

          const indented = 'indented';

        const foo = [
          "something \"really\" long",
          "that has to be moved",
          'to multiple lines',
          "so we can 'test' trailing commas"
        ];
      `,
    };

    it('fixes formatting errors', async () => {
      await using fixture = await createSrcFixture(filesToFormat);

      const format = await sku('format');

      await waitFor(() => {
        expect(format.hasExit()).toMatchObject({ exitCode: 0 });
      });

      for (const fileName of Object.keys(filesToFormat)) {
        const result = await fixture.readFile(fileName, { encoding: 'utf-8' });
        expect(result).toMatchSnapshot(fileName);
      }
    });
  });
});
