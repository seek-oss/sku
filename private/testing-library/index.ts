import {
  render,
  configure,
  waitFor,
  cleanup,
  type Config,
  type RenderOptions,
} from 'cli-testing-library';
import { createRequire } from 'node:module';
import path from 'node:path';

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

// Default configuration for cli-testing-library
const DEFAULT_CONFIG: Partial<Config> = {
  asyncUtilTimeout: 10000,
};

// Configure cli-testing-library with default settings
configure(DEFAULT_CONFIG);

export const renderCli = async (
  command: SkuCommand,
  args: string[] = [],
  options: Partial<RenderOptions> = {},
) => render('node_modules/.bin/sku', [command, ...args], options);

export const configureCli = (config: Partial<typeof DEFAULT_CONFIG>) => {
  configure({ ...DEFAULT_CONFIG, ...config });
};

export const scopeToFixture = (fixtureFolder: string) => {
  const appDir = path.dirname(
    require.resolve(`../../fixtures/${fixtureFolder}/package.json`),
  );

  return {
    render: (
      command: SkuCommand,
      args: string[] = [],
      options: Partial<Omit<RenderOptions, 'cwd'>> = {},
    ) =>
      renderCli(command, args, {
        ...options,
        cwd: appDir,
      }),
  };
};

// Re-export the original functions for direct access
export { waitFor, cleanup };
