import { Command } from 'commander';
import { selectFixture } from './selectFixture.ts';
import { spawn } from 'node:child_process';
import { getFixtureDir } from './getFixtureDir.ts';
import { log } from '@clack/prompts';
import { selectScript } from './selectScript.ts';
import { accent } from '../../utils/src/console/styles.ts';

const program = new Command();

program
  .name('fixture')
  .description('CLI to easily run fixture scripts')
  .argument('[fixture-dir]', 'fuzzy search fixture directory name')
  .argument('[script...]', 'package.json script to run')
  .allowUnknownOption(true)
  .allowExcessArguments(true)
  .action(async (fixtureInput?: string, scriptInput?: string[]) => {
    const fixture = await selectFixture(fixtureInput);
    const [scriptNameInput, ...scriptArgs] = scriptInput ?? [];
    const [scriptName, scriptCommand] = await selectScript(
      fixture,
      scriptNameInput,
    );

    log.info(`Running ${accent(scriptCommand)} in ${accent(fixture)} fixture`);

    spawn('pnpm', [scriptName, ...scriptArgs], {
      cwd: getFixtureDir(fixture),
      env: { ...process.env },
      stdio: 'inherit',
    });
  });

program.parse();
