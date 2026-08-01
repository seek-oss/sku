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
      },
    },
  });
