import { render, type RenderOptions } from 'cli-testing-library';
import { createRequire } from 'node:module';
import { makeFixturePathResolver } from './makeFixturePathResolver.ts';

const require = createRequire(import.meta.url);
const createBin = require.resolve('../../packages/create/dist/cli.js');

export const scopeToFixture = (dir: string) => {
  const fixturePath = makeFixturePathResolver(`fixtures/${dir}/package.json`);

  return {
    create: (
      projectName: string,
      args: string[] = [],
      options: Partial<RenderOptions> = {},
    ) =>
      render('node', [createBin, projectName, ...args], {
        ...options,
        cwd: fixturePath(options.cwd ?? ''),
      }),
    fixturePath,
  };
};
