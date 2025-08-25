import { Command } from 'commander';
import { selectFixture } from './selectFixture.ts';
import { spawn } from 'node:child_process';
import { getFixtureDir } from './getFixtureDir.ts';
import { log } from '@clack/prompts';
import { selectScript } from './selectScript.ts';
import { styleText } from 'node:util';

const program = new Command();

program
  .name('fixture')
  .description('CLI to easily run fixture scripts')
  .argument('[fixture-dir]', 'fuzzy search fixture directory name')
  .argument('[script]', 'package.json script to run')
  .action(async (fixtureInput?: string, scriptInput?: string) => {
    const fixture = await selectFixture(fixtureInput);
    const [scriptName, scriptCommand] = await selectScript(
      fixture,
      scriptInput,
    );

    log.info(
      `Running ${styleText(['bold', 'blue'], scriptCommand)} in ${styleText(['bold', 'blue'], fixture)} fixture`,
    );

    spawn('pnpm', [scriptName], {
      cwd: getFixtureDir(fixture),
      env: { ...process.env, SKU_TELEMETRY: 'false' },
      stdio: 'inherit',
    });
  });

program.parse();
