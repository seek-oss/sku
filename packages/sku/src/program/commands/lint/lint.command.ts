import { Command } from 'commander';
import { lintAction } from './lint.action.js';

export const lintCommand = new Command('lint');

lintCommand
  .description('Run lint tooling over your code.')
  .argument('[paths...]', 'paths to lint')
  .action(lintAction);
