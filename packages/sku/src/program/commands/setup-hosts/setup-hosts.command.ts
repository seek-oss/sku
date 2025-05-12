import { Command } from 'commander';

export const setupHostsCommand = new Command('setup-hosts')
  .description(
    'Update your hosts file to point any configured hosts to your local machine.',
  )
  .action(async (options) => {
    const { setupHostsAction } = await import('./setup-hosts.action.js');
    await setupHostsAction(options);
  });
