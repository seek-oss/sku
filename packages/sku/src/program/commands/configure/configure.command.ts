import { Command } from 'commander';
import { configureAction } from '@/program/commands/configure/configure.action.js';

export const configureCommand = new Command('configure');

configureCommand
  .description('Emit and update configuration files for your project.')
  .action(configureAction);
