import { render, waitFor, type RenderOptions } from 'cli-testing-library';
import { createRequire } from 'node:module';
import { makeFixturePathResolver } from './makeFixturePathResolver.ts';

const require = createRequire(import.meta.url);

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

export const scopeToFixture = (fixtureFolder: string) => {
  const fixturePath = makeFixturePathResolver(
    `fixtures/${fixtureFolder}/package.json`,
  );

  const skuBin = require.resolve(fixturePath('./node_modules/.bin/sku'));

  return {
    /**
     * Runs a `sku` command scoped to the fixture folder.
     */
    sku: (
      command: SkuCommand,
      args: string[] = [],
      options: Partial<RenderOptions> = {},
    ) =>
      render(skuBin, [command, ...args], {
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
