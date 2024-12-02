import { Command } from 'commander';
import { statsOption } from '../../options/stats/stats.option';

export const buildSsrCommand = new Command('build-ssr');

buildSsrCommand
  .description(
    'Create a production build of a server-side rendered application.',
  )
  .addOption(statsOption)
  .action(async ({ stats }) => {
    const { buildSsrAction } = await import('./build-ssr.action.mjs');
    buildSsrAction({ stats });
  });
