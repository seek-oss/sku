import { render, type RenderOptions } from 'cli-testing-library';
import { makeFixturePathResolver } from './makeFixturePathResolver.ts';

export const scopeToFixture = (dir: string) => {
  const fixturePath = makeFixturePathResolver(`fixtures/${dir}/package.json`);

  return {
    create: (
      projectName: string,
      args: string[] = [],
      options: Partial<RenderOptions> = {},
    ) =>
      render('pnpm', ['create-sku', projectName, ...args], {
        ...options,
        cwd: fixturePath(options.cwd ?? ''),
      }),
    fixturePath,
  };
};
