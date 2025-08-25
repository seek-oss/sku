import { join } from 'node:path';
import { getFixtureDir } from './getFixtureDir.ts';
import { log } from '@clack/prompts';
import { styleText } from 'node:util';

export const getFixtureScripts = async (fixtureDir: string) => {
  const fixturePackageJson = await import(
    join(getFixtureDir(fixtureDir), 'package.json')
  );
  const fixtureScripts = fixturePackageJson?.scripts;

  if (!fixtureScripts || Object.keys(fixtureScripts).length === 0) {
    log.error(
      `No scripts found in ${styleText(['bold', 'red'], fixtureDir)} fixture `,
    );
    process.exit(1);
  }

  return fixtureScripts as Record<string, string>;
};
