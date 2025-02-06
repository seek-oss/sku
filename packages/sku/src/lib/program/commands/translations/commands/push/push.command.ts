import { Command } from 'commander';
import { deleteUnusedKeysOption } from './delete-unused-keys.option.js';

const pushCommand = new Command('push');

pushCommand
  .description('Push translations to Phrase')
  .addOption(deleteUnusedKeysOption)
  .action(async ({ deleteUnusedKeys }) => {
    const { pushAction } = await import('./push.action.js');
    pushAction({ deleteUnusedKeys });
  });

export { pushCommand };
