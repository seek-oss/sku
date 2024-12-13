import { Command } from 'commander';
import { siteOption } from '../../options/site/site.option.js';
import { portOption } from '../../options/port/port.option.js';

export const serveCommand = new Command('serve');

serveCommand
  .description(
    'Serve a production build of a statically-rendered application from your local machine.',
  )
  .addOption(siteOption)
  .addOption(portOption)
  .action(async ({ site, port }, command) => {
    const environment = command.parent.opts()?.environment;

    const { serveAction } = await import('./serve.action.js');
    serveAction({ site, port, environment });
  });
