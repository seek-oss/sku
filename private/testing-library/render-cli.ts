import { render, waitFor, type RenderOptions } from 'cli-testing-library';
import { makeFixturePathResolver } from './makeFixturePathResolver.ts';

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

  return {
    /**
     * Runs a `sku` command scoped to the fixture folder.
     */
    sku: (
      command: SkuCommand,
      args: string[] = [],
      options: Partial<RenderOptions> = {},
    ) =>
      render('pnpm', ['sku', command, ...args], {
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
