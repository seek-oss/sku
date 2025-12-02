import { render, type RenderOptions } from 'cli-testing-library';
import { makeFixturePathResolver } from './makeFixturePathResolver.ts';

export const scopeToFixture = (dir: string) => {
  const fixturePath = makeFixturePathResolver(`fixtures/${dir}/package.json`);

  const createSkuBin = require.resolve('../../packages/create/bin.js');

  return {
    create: (
      projectName: string,
      args: string[] = [],
      options: Partial<RenderOptions> = {},
    ) =>
      render(createSkuBin, [projectName, ...args], {
        ...options,
        cwd: fixturePath(options.cwd ?? ''),
      }),
    fixturePath,
  };
};
