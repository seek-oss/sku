import { Command } from 'commander';
import { siteOption } from '../../options/site.option.js';
import { portOption, strictPortOption } from '../../options/port.option.js';

export const serveCommand = new Command('serve')
  .description(
    'Serve a production build of a statically-rendered application from your local machine.',
  )
  .addOption(siteOption)
  .addOption(portOption)
  .addOption(strictPortOption)
  .action(async ({ site, skuContext }, command) => {
    const { serveAction } = await import('./serve.action.js');
    const { environment } = command.optsWithGlobals();
    serveAction({
      site,
      environment,
      skuContext,
    });
  });
