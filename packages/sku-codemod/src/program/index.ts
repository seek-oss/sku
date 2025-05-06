import { Command } from 'commander';
import { runTransform } from '../transform/runner.js';

import packageJson from '../../package.json' with { type: 'json' };
const { name, description, version } = packageJson;

export const program = new Command(name);

program
  .description(description)
  .version(version)
  .argument('[codemod]', 'Codemod slug to run.')
  .argument(
    '[source]',
    'Path to source files or directory to transform including glob patterns.',
  )
  .usage('[codemod] [source] [options]')
  .helpOption('-h, --help', 'Display this help message.')
  .option('-d, --dry', 'Dry run (no changes are made to files)')
  .option(
    '-p, --print',
    'Print transformed files to stdout, useful for development',
  )
  .action(runTransform);
