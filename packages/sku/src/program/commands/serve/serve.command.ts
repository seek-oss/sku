import { Command } from 'commander';
import { siteOption } from '../../options/site/site.option.js';
import { portOption } from '../../options/port/port.option.js';
import { serveAction } from './serve.action.js';

export const serveCommand = new Command('serve');

serveCommand
  .description(
    'Serve a production build of a statically-rendered application from your local machine.',
  )
  .addOption(siteOption)
  .addOption(portOption)
  .action(async ({ site, port, skuContext }, command) => {
    const { environment } = command.optsWithGlobals();
    serveAction({ site, port, environment, skuContext });
  });
