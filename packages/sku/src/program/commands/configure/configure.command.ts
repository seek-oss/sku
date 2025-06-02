import { Command } from 'commander';

export const configureCommand = new Command('configure')
  .description('Emit and update configuration files for your project.')
  .action(async (options) => {
    const { configureAction } = await import('./configure.action.js');
    configureAction(options);
  });
