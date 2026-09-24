import { Command } from 'commander';
import { commands } from './commands/index.js';

export const configureCommand = new Command('configure')
  .description('Emit and update configuration files for your project.')
  .action(async (options) => {
    const { configureAction } = await import('./configure.action.js');
    await configureAction(options);
  });

for (const command of commands) {
  configureCommand.addCommand(command);
}
