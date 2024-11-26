const { Command } = require('commander');

const configure = new Command('configure');

configure
  .description('Emit and update configuration files for your project.')
  .action(() => {
    const configureAction = require('./configure.action');
    configureAction();
  });

module.exports = configure;
