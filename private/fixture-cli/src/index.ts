import { Command } from 'commander';
import { run } from './commands/run.ts';
import { list } from './commands/list.ts';

const program = new Command();

program.name('fixture').description('CLI to easily run fixture scripts');

program.addCommand(list);
program.addCommand(run);

program.parse(process.argv);
