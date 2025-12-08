import { render, type RenderOptions } from 'cli-testing-library';
import { makeFixturePathResolver } from './makeFixturePathResolver.ts';
import { createRequire } from 'node:module';

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
      render(createSkuBin, [projectName, ...args], {
        ...options,
        cwd: fixturePath(options.cwd ?? ''),
      }),
    fixturePath,
  };
};
