import { Command } from 'commander';
import { statsOption } from '../../options/stats/stats.option.js';
import { buildSsrAction } from './build-ssr.action.js';
import { viteBuildSsrHandler } from '@/program/commands/build-ssr/vite-build-ssr-handler.js';

export const buildSsrCommand = new Command('build-ssr');

buildSsrCommand
  .description(
    'Create a production build of a server-side rendered application.',
  )
  .addOption(statsOption)
  .action(buildSsrAction);
