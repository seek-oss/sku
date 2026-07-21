import type { RenderOptions } from 'cli-testing-library';
import { createRequire } from 'node:module';
import fs from 'node:fs/promises';
import { describe, it, expect } from 'vitest';
import { createFixture } from 'fs-fixture';
import type { CodemodName } from '../../packages/codemod/src/utils/constants.js';
import { renderWithEnvironment } from './utils.ts';

const require = createRequire(import.meta.url);
const codemodBin = require.resolve('../../packages/codemod/bin.js');

const renderCodemod = async (
  command: CodemodName,
  args: string[] = [],
  options: Partial<RenderOptions> = {},
) => renderWithEnvironment(codemodBin, [command, ...args], options);

export const scopeToFixture = (dir: string) => ({
  codemod: (
    command: CodemodName,
    args: string[] = [],
    options: Partial<RenderOptions> = {},
  ) =>
    renderCodemod(command, args, {
      ...options,
      cwd: dir,
    }),
});

export type CodemodTestCase = {
  filename: string;
  input: string;
  output: string;
};

export const runCodemodTests = (
  codemodName: CodemodName,
  cases: CodemodTestCase[],
) => {
  describe(codemodName, () => {
    describe.for(cases)(`$filename`, async ({ filename, input, output }) => {
      const fixture = await createFixture({ [filename]: input });
      const { codemod } = scopeToFixture(fixture.path);

      it('"--dry" should not change any files', async () => {
        const cli = await codemod(codemodName, ['.', '--dry']);

        expect(
          await cli.findByText('files found that would be changed.'),
        ).toBeInTheConsole();

        expect(await fs.readFile(fixture.getPath(filename), 'utf-8')).toEqual(
          input,
        );
      });

      it('Should transform files and match expected output', async () => {
        const cli = await codemod(codemodName, ['.']);

        expect(await cli.findByText('Changed files')).toBeInTheConsole();

        expect(await fs.readFile(fixture.getPath(filename), 'utf-8')).toEqual(
          output,
        );
      });
    });
  });
};
