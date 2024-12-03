import { Command } from 'commander';
import { watchOption } from '../../../../options/watch/watch.option.js';

const compileCommand = new Command('compile');

compileCommand
  .description('Compile translations defined in .vocab directories.')
  .addOption(watchOption)
  .action(async ({ watch }) => {
    const { compileAction } = await import('./compile.action');
    compileAction({ watch });
  });

export { compileCommand };
