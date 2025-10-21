import { Command } from 'commander';
import { statsOption } from '../../options/stats.option.js';
import { portOption, strictPortOption } from '../../options/port.option.js';
import { convertLoadableOption } from '../../options/convertLoadable.option.js';
import { listUrlsOption } from '../../options/list-urls.js';

export const startCommand = new Command('start')
  .description(
    'Start the sku development server for a statically-rendered application.',
  )
  .addOption(statsOption)
  .addOption(portOption)
  .addOption(strictPortOption)
  .addOption(listUrlsOption)
  .addOption(convertLoadableOption)
  .action(async (options, command) => {
    const { startAction } = await import('./start.action.js');
    await startAction(options, command);
  });
