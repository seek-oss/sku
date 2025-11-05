import { Command } from 'commander';
import { deleteUnusedKeysOption } from './delete-unused-keys.option.js';
import { autoTranslateOption } from './auto-translate.option.js';

export const pushCommand = new Command('push')
  .description('Push translations to Phrase')
  .addOption(autoTranslateOption)
  .addOption(deleteUnusedKeysOption)
  .action(async (options) => {
    const { pushAction } = await import('./push.action.js');
    await pushAction(options);
  });
