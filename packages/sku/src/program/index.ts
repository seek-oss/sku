import fs from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Command } from 'commander';
import { commands } from './commands/index.js';
import { debugOption } from './options/debug/debug.option.js';
import { configOption } from './options/config/config.option.js';
import { environmentOption } from './options/environment/environment.option.js';
import { initDebug } from '@/utils/debug.js';
import { experimentalBundlerOption } from '@/program/options/expirementalBundler/experimentalBundler.option.js';
import { preActionHook } from '@/program/hooks/preAction/preAction.hook.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

export const program = new Command();

const { name, description, version } = JSON.parse(
  fs.readFileSync(resolve(__dirname, '../../package.json'), 'utf-8'),
);

program
  .name(name)
  .description(description)
  .version(version)
  .allowUnknownOption(true)
  .addOption(environmentOption)
  .addOption(configOption)
  .addOption(debugOption)
  .addOption(experimentalBundlerOption)
  .on('option:debug', () => {
    if (program.opts()?.debug) {
      initDebug();
    }
  })
  .hook('preAction', preActionHook);

for (const command of commands) {
  program.addCommand(command);
}
