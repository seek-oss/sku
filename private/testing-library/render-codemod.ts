import { render, type RenderOptions } from 'cli-testing-library';
import { createRequire } from 'node:module';
import type { CodemodName } from '../../packages/codemod/src/utils/constants.js';

const require = createRequire(import.meta.url);
const codemodBin = require.resolve('../../packages/codemod/bin.js');

const renderCodemod = async (
  command: CodemodName,
  args: string[] = [],
  options: Partial<RenderOptions> = {},
) => render(codemodBin, [command, ...args], options);

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
