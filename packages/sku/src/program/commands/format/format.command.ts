import { Command } from 'commander';
import { formatAction } from './format.action.js';

export const formatCommand = new Command('format');

formatCommand
  .description('Apply all available lint and formatting fixes.')
  .argument('[paths...]', 'paths to format')
  .action(formatAction);
