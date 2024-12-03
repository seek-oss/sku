import { Command } from 'commander';
import { statsOption } from '../../options/stats/stats.option.js';

const startCommand = new Command('start');

startCommand
  .description(
    'Start the sku development server for a statically-rendered application.',
  )
  .addOption(statsOption)
  .action(async ({ stats }, command) => {
    const environment = command.parent.opts()?.environment;

    const { startAction } = await import('./start.action');
    startAction({ stats, environment });
  });

export { startCommand };
