import { Command } from 'commander';
import { pullAction } from './pull.action.js';

const pullCommand = new Command('pull');

pullCommand.description('Pull translations from Phrase').action(pullAction);

export { pullCommand };
