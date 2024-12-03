import { Command } from 'commander';
import { siteOption } from '../../options/site/site.option.mjs';
import { portOption } from '../../options/port/port.option.mjs';

export const serveCommand = new Command('serve');

serveCommand
  .description(
    'Serve a production build of a statically-rendered application from your local machine.',
  )
  .addOption(siteOption)
  .addOption(portOption)
  .action(async ({ site, port }, command) => {
    const environment = command.parent.opts()?.environment;

    const { serveAction } = await import('./serve.action.mjs');
    serveAction({ site, port, environment });
  });
