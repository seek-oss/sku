import fs from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Command } from 'commander';
import { runTransform } from '../transform/runner.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const { name, description, version } = JSON.parse(
  fs.readFileSync(resolve(__dirname, '../../package.json'), 'utf-8'),
);

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
  .option('--verbose', 'Show more information about the transform process')
  .action(runTransform)
  .allowUnknownOption()
  .enablePositionalOptions();
