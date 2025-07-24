import {
  render,
  configure,
  waitFor,
  type Config,
  type RenderOptions,
} from 'cli-testing-library';
import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);
const skuBin = require.resolve('../../packages/sku/bin/bin.js');

type SkuCommand =
  | 'serve'
  | 'start'
  | 'start-ssr'
  | 'build'
  | 'build-ssr'
  | 'configure'
  | 'format'
  | 'init'
  | 'lint'
  | 'test';

// Default configuration for cli-testing-library
const DEFAULT_CONFIG: Partial<Config> = {
  asyncUtilTimeout: 50_000,
};

// Configure cli-testing-library with default settings
configure(DEFAULT_CONFIG);

const renderCli = async (
  command: SkuCommand,
  args: string[] = [],
  options: Partial<RenderOptions> = {},
) => render(skuBin, [command, ...args], options);

export const scopeToFixture = (fixtureFolder: string) => {
  const appDir = path.dirname(
    require.resolve(`../../fixtures/${fixtureFolder}/package.json`),
  );

  return {
    render: (
      command: SkuCommand,
      args: string[] = [],
      options: Partial<RenderOptions> = {},
    ) =>
      renderCli(command, args, {
        ...options,
        cwd: path.join(appDir, options.cwd ?? ''),
      }),
    node: (
      args: string[] = [],
      options: Partial<Omit<RenderOptions, 'cwd'>> = {},
    ) =>
      render('node', args, {
        ...options,
        cwd: appDir,
      }),
    exec: (
      command: string,
      args: string[] = [],
      options: Partial<Omit<RenderOptions, 'cwd'>> = {},
    ) =>
      render(command, args, {
        ...options,
        cwd: appDir,
      }),
    joinPath: (...paths: string[]) => path.join(appDir, ...paths),
  };
};

// Re-export the original functions for direct access
export { waitFor };
