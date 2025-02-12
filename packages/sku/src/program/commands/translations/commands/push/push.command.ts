import { Command } from 'commander';
import { deleteUnusedKeysOption } from './delete-unused-keys.option.js';
import { pushAction } from './push.action.js';

const pushCommand = new Command('push');

pushCommand
  .description('Push translations to Phrase')
  .addOption(deleteUnusedKeysOption)
  .action(pushAction);

export { pushCommand };
