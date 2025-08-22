import Fuse from 'fuse.js';
import { getAllFixtures } from './getAllFixtures.ts';
import { styleText } from 'node:util';
import { log, autocomplete, cancel, isCancel } from '@clack/prompts';

export const selectFixture = async (input?: string): Promise<string> => {
  const allFixtures = await getAllFixtures();
  const fixtureMatches = input ? fuzzySearch(input, allFixtures) : allFixtures;

  if (input && fixtureMatches.length === 0) {
    log.error(
      `No fixtures matching '${styleText(['bold', 'red'], input)}' found`,
    );
    process.exit(1);
  }

  if (fixtureMatches.length === 1) {
    log.info(
      `Found matching fixtures ${styleText(['bold', 'blue'], fixtureMatches[0])}`,
    );
    return fixtureMatches[0];
  }

  const selectedFixture = await autocomplete({
    message: 'Select a fixture',
    options: fixtureMatches.map((match) => ({
      value: match,
    })),
  });

  if (isCancel(selectedFixture)) {
    cancel('Operation cancelled.');
    process.exit(0);
  }

  return selectedFixture;
};

const fuzzySearch = (searchInput: string, allFixtures: string[]): string[] => {
  const fuse = new Fuse(allFixtures, { threshold: 0.3 });
  return fuse.search(searchInput).map((result) => result.item);
};
