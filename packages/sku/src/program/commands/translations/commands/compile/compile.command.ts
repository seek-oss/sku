import { Command } from 'commander';
import { watchOption } from '../../../../options/watch/watch.option.js';
import { compileAction } from './compile.action.js';

const compileCommand = new Command('compile');

compileCommand
  .description('Compile translations defined in .vocab directories.')
  .addOption(watchOption)
  .action(compileAction);

export { compileCommand };
