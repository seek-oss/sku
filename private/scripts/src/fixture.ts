import { resolve, join } from 'node:path';
import { readdir } from 'node:fs/promises';
import { autocomplete, group, cancel, log } from '@clack/prompts';

import { spawn } from 'cross-spawn';
import { styleText } from 'node:util';

const fixturesDir = resolve('../../fixtures');
const fixturesDirContents = await readdir(fixturesDir, {
  withFileTypes: true,
});

const allFixtures = fixturesDirContents
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);

const groupResult = await group(
  {
    fixture: () =>
      autocomplete({
        message: 'Select a fixture',
        options: allFixtures.map((fixture) => ({
          value: fixture,
        })),
      }),
    script: async ({ results }) => {
      if (!results.fixture) {
        throw new Error('No fixture selected somehow');
      }

      const fixturePackageJson = await import(
        join(fixturesDir, results.fixture, 'package.json')
      );
      const fixtureScripts = fixturePackageJson?.scripts;

      if (!fixtureScripts || Object.keys(fixtureScripts).length === 0) {
        throw new Error(
          `No scripts found in '${groupResult.fixture}' fixture `,
        );
      }

      return autocomplete({
        message: 'Select a script',
        options: Object.entries(fixtureScripts as Record<string, string>).map(
          ([scriptName, script]) => ({
            label: scriptName,
            value: script,
          }),
        ),
      });
    },
  },
  {
    onCancel: () => {
      cancel('Operation cancelled.');
      process.exit(0);
    },
  },
);

const workingDirectory = join(fixturesDir, groupResult.fixture);

log.info(
  `Running ${styleText(['bold', 'blue'], groupResult.script as string)} in ${styleText(['bold', 'blue'], groupResult.fixture)} fixture`,
);

spawn('pnpm', (groupResult.script as string).split(' '), {
  cwd: workingDirectory,
  env: { ...process.env, SKU_TELEMETRY: 'false' },
  stdio: 'inherit',
});
