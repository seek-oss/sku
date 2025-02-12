import { Command } from 'commander';

import { testAction } from './test.action.js';

const testCommand = new Command('test');

testCommand
  .description('Run unit tests.')
  .allowUnknownOption(true)
  .allowExcessArguments(true)
  .action(testAction);

export { testCommand };
