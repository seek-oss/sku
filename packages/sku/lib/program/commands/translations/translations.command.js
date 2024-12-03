import { Command } from 'commander';
import { commands } from './commands';

const translationsCommand = new Command('translations');

translationsCommand.description('Manage vocab translations');

for (const command of commands) {
  translationsCommand.addCommand(command);
}

export { translationsCommand };
