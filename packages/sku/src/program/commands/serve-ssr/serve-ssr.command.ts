import { Command } from 'commander';
import { serveSsrAction } from './serve-ssr.action.js';

const serveSsrCommand = new Command('serve-ssr');

serveSsrCommand
  .description('Serve the built ssr application via an express server.')
  .action(serveSsrAction);

export { serveSsrCommand };
