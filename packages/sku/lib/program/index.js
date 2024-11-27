const { Command } = require('commander');
const commands = require('./commands');
const packageManagerOption = require('./options/packageManager/packageManager.option');
const debugOption = require('./options/debug/debug.option');
const configOption = require('./options/config/config.option');
const environmentOption = require('./options/environment/environment.option');
const { name, description, version } = require('../../package.json');

const program = new Command();

program
  .name(name)
  .description(description)
  .version(version)
  .allowUnknownOption(true)
  .addOption(environmentOption)
  .addOption(configOption)
  .addOption(packageManagerOption)
  .addOption(debugOption);

for (const command of commands) {
  program.addCommand(command);
}

module.exports = program;
