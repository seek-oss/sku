import {
  render,
  type RenderOptions,
  type RenderResult,
} from 'cli-testing-library';

export const renderWithEnvironment = (
  command: string,
  args: string[] = [],
  opts: Partial<RenderOptions> = {},
): Promise<RenderResult> =>
  render(command, args, {
    ...opts,
    spawnOpts: {
      ...opts.spawnOpts,
      env: {
        ...process.env,
        ...opts.spawnOpts?.env,
        // Speed up repeat runs by preferring cached registry metadata. Mainly affects CI.
        npm_config_prefer_offline: 'true',
      },
    },
  });
