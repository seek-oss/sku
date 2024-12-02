import { Command } from 'commander';

export const configureCommand = new Command('configure');

configureCommand
  .description('Emit and update configuration files for your project.')
  .action(async () => {
    const { configureAction } = await import('./configure.action.mjs');
    configureAction();
  });
