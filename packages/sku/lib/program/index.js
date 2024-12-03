import fs from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Command } from 'commander';
import { commands } from './commands/index.js';
import { debugOption } from './options/debug/debug.option';
import { configOption } from './options/config/config.option';
import { environmentOption } from './options/environment/environment.option';
import { initDebug } from '../utils/debug';
import { setConfigPath } from '../../context/configPath.js';

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
  .on('option:debug', () => {
    if (program.opts()?.debug) {
      initDebug();
    }
  })
  .on('option:config', () => {
    setConfigPath(program.opts()?.config);
  });

for (const command of commands) {
  program.addCommand(command);
}
