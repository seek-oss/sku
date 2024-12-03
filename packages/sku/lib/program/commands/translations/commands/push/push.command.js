import { Command } from 'commander';
import { deleteUnusedKeysOption } from './delete-unused-keys.option';

const pushCommand = new Command('push');

pushCommand
  .description('Push translations to Phrase')
  .addOption(deleteUnusedKeysOption)
  .action(async ({ deleteUnusedKeys }) => {
    const { pushAction } = await import('./push.action');
    pushAction({ deleteUnusedKeys });
  });

export { pushCommand };
