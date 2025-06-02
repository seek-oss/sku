import { Command } from 'commander';
import { statsOption } from '../../options/stats/stats.option.js';

export const buildSsrCommand = new Command('build-ssr')
  .description(
    'Create a production build of a server-side rendered application.',
  )
  .addOption(statsOption)
  .action(async (options) => {
    const { buildSsrAction } = await import('./build-ssr.action.js');
    await buildSsrAction(options);
  });
