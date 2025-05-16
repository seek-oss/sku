import {
  describe,
  test,
  beforeAll,
  afterAll,
  expect as globalExpect,
} from 'vitest';
import path from 'node:path';
import fs from 'node:fs/promises';
import dedent from 'dedent';
import { runSkuScriptInDir } from '@sku-private/test-utils';
import { createRequire } from 'node:module';
import { stripVTControlCharacters as stripAnsi } from 'node:util';

const require = createRequire(import.meta.url);

const appDirectory = path.dirname(
  require.resolve('@sku-fixtures/lint-format/sku.config.ts'),
);
const srcDirectory = path.join(appDirectory, 'src');
const testFile = (fileName: string) => path.join(srcDirectory, fileName);

const filesToLint: Record<string, string> = {
  'utils.test.ts': dedent/* ts */ `
    console.log('foo');

    it.only('should test something', () => {
      let foo = true;

      expect(foo).toBe(true);
    });\n`,
  'typescriptFile.ts': dedent/* ts */ `
    const foo: number = 'a string';
  `,
  'unformattedFile1.js': dedent/* js */ `
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

const filesToFormat: Record<string, string> = {
  'importOrder1.ts': dedent/* ts */ `
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
  'importOrder2.ts': dedent/* ts */ `
    import aStyle from './a.css';
    import bStyle from './b.css';
    import cStyle from '../c.css';

    import b from './b';
    import a from './a';
    import c from '../c';
  `,
  'fixableLintError.ts': dedent/* ts */ `
    const foo = () => {
      return 'foo';
    };
  `,
  'unformattedFile2.ts': dedent/* ts */ `
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

globalExpect.addSnapshotSerializer({
  serialize: (val) => {
    const { stdout } = val;
    // Remove some logs that contain file paths that are unique to the machine
    const sanitizedStdout = stdout
      .split('\n')
      .filter((line: string) => !line.includes('sku/fixtures/lint-format'))
      .join('\n');

    return dedent`
      stdout: ${stripAnsi(sanitizedStdout)}
    `;
  },
  test: (val) => typeof val === 'object' && val.hasOwnProperty('stdout'),
});

describe('lint-format', () => {
  beforeAll(async () => {
    await fs.mkdir(srcDirectory, { recursive: true });
  });

  afterAll(async () => {
    await fs.rm(srcDirectory, { recursive: true, force: true });
  });

  describe('sku lint', () => {
    test.for(Object.keys(filesToLint))(
      'lint errors are reported: %s',
      async (fileName, { expect }) => {
        const filePath = testFile(fileName);
        await fs.writeFile(filePath, filesToLint[fileName]);

        await expect(
          runSkuScriptInDir('lint', appDirectory, { args: [filePath] }),
        ).rejects.toMatchSnapshot();
      },
    );
  });

  describe('sku format', () => {
    globalExpect.addSnapshotSerializer({
      serialize: (val) => val,
      test: (val) => typeof val === 'string',
    });

    test.for(Object.keys(filesToFormat))(
      'errors are fixed: %s',
      async (fileName, { expect }) => {
        const filePath = testFile(fileName);
        await fs.writeFile(filePath, filesToFormat[fileName]);

        await runSkuScriptInDir('format', appDirectory);

        const result = await fs.readFile(filePath, { encoding: 'utf-8' });

        expect(result).toMatchSnapshot();
      },
    );
  });
});
