import { Command } from 'commander';
import { validateAction } from './validate.action.js';

const validateCommand = new Command('validate');

validateCommand
  .description('Validate .vocab files')
  .action(async ({ skuContext }) => {
    validateAction({ skuContext });
  });

export { validateCommand };
