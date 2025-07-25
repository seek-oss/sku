import { render, type RenderOptions } from 'cli-testing-library';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const codemodBin = require.resolve('../../packages/codemod/bin.js');

type Command = 'transform-vite-loadable';

const renderCodemod = async (
  command: Command,
  args: string[] = [],
  options: Partial<RenderOptions> = {},
) => render(codemodBin, [command, ...args], options);

export const scopeToFixture = (dir: string) => ({
  codemod: (
    command: Command,
    args: string[] = [],
    options: Partial<RenderOptions> = {},
  ) =>
    renderCodemod(command, args, {
      ...options,
      cwd: dir,
    }),
});
