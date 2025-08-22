import { readdir } from 'node:fs/promises';
import { getFixtureDir } from './getFixtureDir.ts';

export const getAllFixtures = async () => {
  const fixturesDirContents = await readdir(getFixtureDir(), {
    withFileTypes: true,
  });

  return fixturesDirContents
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
};
