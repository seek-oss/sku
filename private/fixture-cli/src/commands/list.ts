import { autocomplete, group, cancel, log } from '@clack/prompts';
import { createCommand } from 'commander';
import { spawn } from 'cross-spawn';
import { styleText } from 'node:util';
import { getAllFixtures } from '../utils/getAllFixtures.ts';
import { getFixtureScripts } from '../utils/getFixtureScripts.ts';
import { getFixtureDir } from '../utils/getFixtureDir.ts';

export const list = createCommand('list')
  .description('list all available fixtures and their scripts')
  .action(async () => {
    const allFixtures = await getAllFixtures();

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

          const fixtureScripts = await getFixtureScripts(results.fixture);

          return autocomplete({
            message: 'Select a script',
            options: Object.entries(fixtureScripts).map(
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

    const workingDirectory = getFixtureDir(groupResult.fixture);

    log.info(
      `Running ${styleText(['bold', 'blue'], groupResult.script as string)} in ${styleText(['bold', 'blue'], groupResult.fixture)} fixture`,
    );

    spawn('pnpm', (groupResult.script as string).split(' '), {
      cwd: workingDirectory,
      env: { ...process.env, SKU_TELEMETRY: 'false' },
      stdio: 'inherit',
    });
  });
