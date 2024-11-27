const { Command } = require('commander');
const deleteUnusedKeysOption = require('./delete-unused-keys.option');

const push = new Command('push');

push
  .description('Push translations to Phrase')
  .addOption(deleteUnusedKeysOption)
  .action(({ deleteUnusedKeys }) => {
    const pushAction = require('./push.action');
    pushAction({ deleteUnusedKeys });
  });

module.exports = push;
