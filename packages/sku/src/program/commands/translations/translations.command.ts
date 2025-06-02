import { Command } from 'commander';
import { commands } from './commands/index.js';

export const translationsCommand = new Command('translations').description(
  'Manage vocab translations',
);

for (const command of commands) {
  translationsCommand.addCommand(command);
}
