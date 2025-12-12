import { describe, it, beforeEach, afterEach, expect } from 'vitest';
import path from 'node:path';
import fs from 'node:fs/promises';
import dedent from 'dedent';
import { scopeToFixture } from '@sku-private/testing-library';

const { sku, fixturePath } = scopeToFixture('lint-format');

const srcDirectory = fixturePath('src');
const testFile = (fileName: string) => path.join(srcDirectory, fileName);

describe('lint-format', () => {
  beforeEach(async () => {
    await fs.mkdir(srcDirectory, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(srcDirectory, { recursive: true, force: true });
  });

  describe('sku lint', () => {
    it('should catch type errors', async () => {
      const fileName = 'typescriptFile.ts';
      const fileContents = dedent /* ts */ `
        const foo: number = 'a string';
      `;
      await fs.writeFile(testFile(fileName), fileContents);

      const lint = await sku('lint');
      expect(
        await lint.findByText('src/typescriptFile.ts(1,7): error'),
      ).toBeInTheConsole();
    });

    it('should catch ES lint errors', async () => {
      const fileName = 'utils.test.ts';
      const fileContents = dedent /* ts */ `
        console.log('foo');

        it.only('should test something', () => {
          let foo = true;

          expect(foo).toBe(true);
        });\n`;
      await fs.writeFile(testFile(fileName), fileContents);

      const lint = await sku('lint');
      expect(
        await lint.findByText('Checking code with ESLint'),
      ).toBeInTheConsole();
      expect(
        await lint.findByText('3 problems (3 errors, 0 warnings)'),
      ).toBeInTheConsole();
    });

    it('should catch prettier errors', async () => {
      const fileName = 'unformattedFile1.js';
      const fileContents = dedent /* js */ `
        import { something } from "with-double-quotes";

          const indented = 'indented';

        const foo = [
          "something \"really\" long",
          "that has to be moved",
          'to multiple lines',
          "so we can 'test' trailing commas"
        ];
      `;
      await fs.writeFile(testFile(fileName), fileContents);

      const lint = await sku('lint');
      expect(
        await lint.findByText('Checking code with Prettier'),
      ).toBeInTheConsole();
      expect(
        await lint.findByText('src/unformattedFile1.js'),
      ).toBeInTheConsole();
      expect(
        await lint.findByError(
          'Error: The file(s) listed above failed the prettier check',
        ),
      ).toBeInTheConsole();
      expect(
        await lint.findByText("To fix this issue, run 'pnpm run format'"),
      ).toBeInTheConsole();
    });

    it('should use vitest lint rules when test runner is vitest', async () => {
      const fileName = 'utils.test.ts';
      const fileContents = dedent /* ts */ `
        console.log('foo');

        it.only('should test something', () => {
          let foo = true;

          expect(foo).toBe(true);
        });\n`;
      await fs.writeFile(testFile(fileName), fileContents);

      const lint = await sku('lint', ['--config', 'sku.config.vitest.ts']);
      expect(
        await lint.findByText('Checking code with ESLint'),
      ).toBeInTheConsole();
      expect(
        await lint.findByText('3 problems (3 errors, 0 warnings)'),
      ).toBeInTheConsole();
      expect(
        await lint.findByText('vitest/no-focused-tests'),
      ).toBeInTheConsole();
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
        import utils from 'src/utils'; // internal
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

    it.for(Object.keys(filesToFormat))(
      'errors are fixed: %s',
      async (fileName) => {
        const filePath = testFile(fileName);
        await fs.writeFile(filePath, filesToFormat[fileName]);

        const format = await sku('format');
        expect(
          await format.findByText('Formatting complete'),
        ).toBeInTheConsole();

        const result = await fs.readFile(filePath, { encoding: 'utf-8' });
        expect(result).toMatchSnapshot();
      },
    );
  });
});
