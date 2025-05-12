import { Command } from 'commander';

export const validateCommand = new Command('validate')
  .description('Validate .vocab files')
  .action(async (options) => {
    const { validateAction } = await import('./validate.action.js');
    await validateAction(options);
  });
