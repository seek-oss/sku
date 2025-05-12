import { Command } from 'commander';

export const configureCommand = new Command('configure');

configureCommand
  .description('Emit and update configuration files for your project.')
  .action(async (options) => {
    const { configureAction } = await import('./configure.action.js');
    configureAction(options);
  });
