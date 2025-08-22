import { createCommand } from 'commander';

import Fuse from 'fuse.js';

import { autocomplete, log, isCancel, cancel } from '@clack/prompts';
import spawn from 'cross-spawn';
import { getAllFixtures } from '../utils/getAllFixtures.ts';
import { getFixtureDir } from '../utils/getFixtureDir.ts';
import { getFixtureScripts } from '../utils/getFixtureScripts.ts';
import { styleText } from 'node:util';

export const run = createCommand('run')
  .description('run a fixture script with a fuzzy folder name search')
  .argument('<fixture>', 'fuzzy searched fixture name')
  .argument('<script>', 'name of the script to run')
  .action(async (fixture: string, script: string) => {
    const allFixtures = await getAllFixtures();

    const fuse = new Fuse(allFixtures, { threshold: 0.3 });

    const fixtureMatches = fuse.search(fixture);

    if (fixtureMatches.length === 0) {
      log.error(
        `No fixtures matching '${styleText(['bold', 'red'], fixture)}' found`,
      );
      process.exit(1);
    }

    if (fixtureMatches.length === 1) {
      runCommand(fixtureMatches[0].item, script);
      return;
    }

    const selectedFixture = await autocomplete({
      message: 'Select a fixture',
      options: fixtureMatches.map((match) => ({
        value: match.item,
      })),
    });

    if (isCancel(selectedFixture)) {
      cancel('Operation cancelled.');
      process.exit(0);
    }

    runCommand(selectedFixture, script);
  });

const runCommand = async (fixture: string, script: string) => {
  const fixtureScripts = await getFixtureScripts(fixture);

  if (!(script in fixtureScripts)) {
    log.error(
      `Script ${styleText(['bold', 'red'], script)} not found in ${styleText(['bold', 'red'], fixture)} fixture`,
    );
    process.exit(1);
  }

  log.info(
    `Running ${styleText(['bold', 'blue'], fixtureScripts[script])} in ${styleText(['bold', 'blue'], fixture)} fixture`,
  );

  spawn('pnpm', [script], {
    cwd: getFixtureDir(fixture),
    env: { ...process.env, SKU_TELEMETRY: 'false' },
    stdio: 'inherit',
  });
};
