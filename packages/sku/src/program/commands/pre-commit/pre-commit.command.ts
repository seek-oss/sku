import { Command } from 'commander';
import { preCommitAction } from '@/program/commands/pre-commit/pre-commit.action.js';

export const preCommitCommand = new Command('pre-commit');

preCommitCommand
  .description('Run the sku pre-commit hook.')
  .action(preCommitAction);
