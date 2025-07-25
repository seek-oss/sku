import { render, waitFor, type RenderOptions } from 'cli-testing-library';
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

const renderCli = async (
  command: SkuCommand,
  args: string[] = [],
  options: Partial<RenderOptions> = {},
) => render(skuBin, [command, ...args], options);

export const scopeToFixture = (fixtureFolder: string) => {
  const appDir = path.dirname(
    require.resolve(`../../fixtures/${fixtureFolder}/package.json`),
  );

  const fixturePath = (...paths: string[]) => path.join(appDir, ...paths);

  return {
    /**
     * Runs a `sku` command scoped to the fixture folder.
     */
    sku: (
      command: SkuCommand,
      args: string[] = [],
      options: Partial<RenderOptions> = {},
    ) =>
      renderCli(command, args, {
        ...options,
        cwd: fixturePath(options.cwd ?? ''),
      }),
    /**
     * Runs a `node` command scoped to the fixture folder.
     */
    node: (args: string[] = [], options: Partial<RenderOptions> = {}) =>
      render('node', args, {
        ...options,
        cwd: fixturePath(options.cwd ?? ''),
      }),
    /**
     * Runs an arbitrary command scoped to the fixture folder.
     */
    exec: (
      command: string,
      args: string[] = [],
      options: Partial<RenderOptions> = {},
    ) =>
      render(command, args, {
        ...options,
        cwd: fixturePath(options.cwd ?? ''),
      }),
    /**
     * Returns a path relative to the fixture folder.
     */
    fixturePath,
  };
};

// Re-export the original functions for direct access
export { waitFor };
