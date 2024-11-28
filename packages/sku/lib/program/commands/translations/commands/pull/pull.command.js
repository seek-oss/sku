const { Command } = require('commander');

const pull = new Command('pull');

pull.description('Pull translations from Phrase').action(() => {
  const pullAction = require('./pull.action');
  pullAction();
});

module.exports = pull;
