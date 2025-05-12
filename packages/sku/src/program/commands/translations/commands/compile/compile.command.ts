import { Command } from 'commander';
import { watchOption } from '../../../../options/watch/watch.option.js';

export const compileCommand = new Command('compile')
  .description('Compile translations defined in .vocab directories.')
  .addOption(watchOption)
  .action(async (options) => {
    const { compileAction } = await import('./compile.action.js');
    await compileAction(options);
  });
