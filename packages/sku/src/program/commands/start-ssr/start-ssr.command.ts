import { Command } from 'commander';
import { statsOption } from '../../options/stats/stats.option.js';
import { startSsrAction } from './start-ssr.action.js';
import { viteStartSsrHandler } from '@/program/commands/start-ssr/vite-start-ssr-handler.js';

const startSsrCommand = new Command('start-ssr');

startSsrCommand
  .description(
    'Start the sku development server for a server-rendered application.',
  )
  .addOption(statsOption)
  .action(async ({ stats, skuContext }) => {
    if (skuContext.bundler !== 'vite') {
      startSsrAction({ stats, skuContext });
    } else {
      viteStartSsrHandler(skuContext);
    }
  });

export { startSsrCommand };
