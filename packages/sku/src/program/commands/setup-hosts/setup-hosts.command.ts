import { Command } from 'commander';
import { setupHostsAction } from './setup-hosts.action.js';

const setupHostsCommand = new Command('setup-hosts');

setupHostsCommand
  .description(
    'Update your hosts file to point any configured hosts to your local machine.',
  )
  .action(setupHostsAction);

export { setupHostsCommand };
