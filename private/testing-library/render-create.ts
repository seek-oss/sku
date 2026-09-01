import type { RenderOptions } from 'cli-testing-library';
import { makeFixturePathResolver } from './makeFixturePathResolver.ts';
import { createRequire } from 'node:module';
import { renderWithEnvironment } from './utils.ts';

const require = createRequire(import.meta.url);
const createSkuBin = require.resolve('../../packages/create/bin.js');

export const scopeToFixture = (dir: string) => {
  const fixturePath = makeFixturePathResolver(`fixtures/${dir}/package.json`);

  return {
    create: (
      projectName: string,
      args: string[] = [],
      options: Partial<RenderOptions> = {},
    ) =>
      renderWithEnvironment(createSkuBin, [projectName, ...args], {
        ...options,
        spawnOpts: {
          ...options.spawnOpts,
          env: {
            ...options.spawnOpts?.env,
            // Speed up repeat runs by preferring cached registry metadata. Mainly affects CI.
            npm_config_prefer_offline: 'true',
          },
        },
        cwd: fixturePath(options.cwd ?? ''),
      }),
    fixturePath,
  };
};
