import { Command } from 'commander';

const validateCommand = new Command('validate');

validateCommand.description('Validate .vocab files').action(async () => {
  const { validateAction } = await import('./validate.action');
  validateAction();
});

export { validateCommand };
