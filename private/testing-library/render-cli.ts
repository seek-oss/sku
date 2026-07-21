import { waitFor, type RenderOptions } from 'cli-testing-library';
import { createRequire } from 'node:module';
import { makeFixturePathResolver } from './makeFixturePathResolver.ts';
import { renderWithEnvironment } from './utils.ts';

const require = createRequire(import.meta.url);

/**
 * Keep managed ignore sections stable across dual-config fixtures
 * (e.g. target dist vs dist-ssr) so tests do not churn .gitignore/.prettierignore.
 */
const skuTestEnv = {
  SKU_IGNORE_TARGETS: 'dist,dist-ssr',
};

type SkuCommand =
  | 'serve'
  | 'start'
  | 'start-ssr'
  | 'build'
  | 'build-ssr'
  | 'configure'
  | 'format'
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
      renderWithEnvironment(skuBin, [command, ...args], {
        ...options,
        cwd: fixturePath(options.cwd ?? ''),
        spawnOpts: {
          ...options.spawnOpts,
          env: {
            ...skuTestEnv,
            ...options.spawnOpts?.env,
          },
        },
      }),

    /**
     * Runs a `node` command scoped to the fixture folder.
     */
    node: (args: string[] = [], options: Partial<RenderOptions> = {}) =>
      renderWithEnvironment('node', args, {
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
      renderWithEnvironment(command, args, {
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
