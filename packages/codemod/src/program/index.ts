import { Command } from 'commander';
import { runTransform } from '../transform/runner.js';

import packageJson from '../../package.json' with { type: 'json' };
const { name, description, version } = packageJson;

export const program = new Command(name);

program
  .description(description)
  .version(version)
  .argument('[codemod]', 'Codemod slug to run.')
  .argument('[path]', 'Path to a directory to transform.')
  .usage('[codemod] [path] [options]')
  .helpOption('-h, --help', 'Display this help message.')
  .option('-d, --dry', 'Dry run (no changes are made to files)')
  .option(
    '-p, --print',
    'Print transformed files to stdout, useful for development',
  )
  .action(runTransform);
