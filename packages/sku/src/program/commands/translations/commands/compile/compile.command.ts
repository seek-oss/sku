import { Command } from 'commander';
import { watchOption } from '../../../../options/watch/watch.option.js';

const compileCommand = new Command('compile');

compileCommand
  .description('Compile translations defined in .vocab directories.')
  .addOption(watchOption)
  .action(async (options) => {
    const { compileAction } = await import('./compile.action.js');
    await compileAction(options);
  });

export { compileCommand };
