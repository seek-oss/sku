import { Command } from 'commander';

const setupHostsCommand = new Command('setup-hosts');

setupHostsCommand
  .description(
    'Update your hosts file to point any configured hosts to your local machine.',
  )
  .action(async () => {
    const { setupHostsAction } = await import('./setup-hosts.action.js');
    setupHostsAction();
  });

export { setupHostsCommand };
