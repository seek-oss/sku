import {
  render,
  configure,
  waitFor,
  cleanup as _cleanup,
  type Config,
  type RenderOptions,
} from 'cli-testing-library';
import { createRequire } from 'node:module';
import path from 'node:path';
import { onTestFinished } from 'vitest';

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
  asyncUtilTimeout: 20_000,
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

const skipCleanupIds = new Set<string>();

export const cleanup = async (task?: { id: string }) => {
  if (task?.id && skipCleanupIds.has(task.id)) {
    return;
  }

  await _cleanup();
};

/**
 * Skips cleanup for the given test id, leaving tasks running in the background.
 * Make sure to run cleanup manually once you are ready to clean up the tasks.
 */
export const skipCleanup = (id: string) => {
  skipCleanupIds.add(id);
  // onTestFinished is called after the `afterEach` hook, but before the `afterAll` hook
  // so we use this to skip cleanup for just the given test id.
  onTestFinished(() => {
    skipCleanupIds.delete(id);
  });
};

// Re-export the original functions for direct access
export { waitFor };
