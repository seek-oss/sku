const { Command } = require('commander');

const setupHosts = new Command('setup-hosts');

setupHosts
  .description(
    'Update your hosts file to point any configured hosts to your local machine.',
  )
  .action(() => {
    const setupHostsAction = require('./setup-hosts.action');
    setupHostsAction();
  });

module.exports = setupHosts;
