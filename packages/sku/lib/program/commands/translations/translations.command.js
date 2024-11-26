const { Command } = require('commander');
const commands = require('./commands');

const translations = new Command('translations');

translations.description('Manage vocab translations');

for (const command of commands) {
  translations.addCommand(command);
}

module.exports = translations;
