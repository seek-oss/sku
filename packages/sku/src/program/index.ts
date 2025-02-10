import fs from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Command } from 'commander';
import { commands } from './commands/index.js';
import { debugOption } from './options/debug/debug.option.js';
import { configOption } from './options/config/config.option.js';
import { environmentOption } from './options/environment/environment.option.js';
import { initDebug } from '@/utils/debug.js';
import { getSkuContext } from '@/context/createSkuContext.js';
import { initializeTelemetry } from '@/services/telemetry/index.js';

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
  .hook('preAction', (_thisCommand, actionCommand) => {
    const skuContext = getSkuContext({
      configPath: program.opts()?.config,
    });
    initializeTelemetry(skuContext);
    actionCommand.setOptionValue('skuContext', skuContext);
  });

for (const command of commands) {
  program.addCommand(command);
}
