import { Command } from 'commander';
import { statsOption } from '../../options/stats/stats.option';

const startSsrCommand = new Command('start-ssr');

startSsrCommand
  .description(
    'Start the sku development server for a server-rendered application.',
  )
  .addOption(statsOption)
  .action(async ({ stats }) => {
    const { startSsrAction } = await import('./start-ssr.action');
    startSsrAction({ stats });
  });

export { startSsrCommand };
