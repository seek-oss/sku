import { Command } from 'commander';
import { statsOption } from '../../options/stats/stats.option.js';
import { startAction } from './start.action.js';

const startCommand = new Command('start');

startCommand
  .description(
    'Start the sku development server for a statically-rendered application.',
  )
  .addOption(statsOption)
  .action(async ({ stats, skuContext }, command) => {
    const environment = command.parent.opts()?.environment;
    try {
      startAction({ stats, environment, skuContext });
    } catch (error) {
      console.error('startCommand error', error);
      process.exit(1);
    }
  });

export { startCommand };
