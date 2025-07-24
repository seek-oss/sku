import {
  render,
  configure,
  type Config,
  type RenderOptions,
} from 'cli-testing-library';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const codemodBin = require.resolve('../../packages/codemod/bin.js');

type Command = 'transform-vite-loadable';

// Default configuration for cli-testing-library
const DEFAULT_CONFIG: Partial<Config> = {
  asyncUtilTimeout: 1_000,
};

// Configure cli-testing-library with default settings
configure(DEFAULT_CONFIG);

const renderCodemod = async (
  command: Command,
  args: string[] = [],
  options: Partial<RenderOptions> = {},
) => render(codemodBin, [command, ...args], options);

export const scopeToFixture = (dir: string) => ({
  render: (
    command: Command,
    args: string[] = [],
    options: Partial<RenderOptions> = {},
  ) =>
    renderCodemod(command, args, {
      ...options,
      cwd: dir,
    }),
});
