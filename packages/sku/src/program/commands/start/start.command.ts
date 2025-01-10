import { Command } from 'commander';
import { statsOption } from '../../options/stats/stats.option.js';
import { startAction } from './start.action.js';
import { viteStartHandler } from '@/program/commands/start/vite-start-handler.js';

const startCommand = new Command('start');

startCommand
  .description(
    'Start the sku development server for a statically-rendered application.',
  )
  .addOption(statsOption)
  .action(async ({ stats, skuContext }, command) => {
    const environment = command.parent.opts()?.environment;
    if (skuContext.bundler !== 'vite') {
      startAction({ stats, environment, skuContext });
    } else {
      viteStartHandler(skuContext);
    }
  });

export { startCommand };
