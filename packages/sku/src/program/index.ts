import { Command } from 'commander';
import { commands } from './commands/index.js';
import { debugOption } from './options/debug/debug.option.js';
import { configOption } from './options/config/config.option.js';
import { environmentOption } from './options/environment/environment.option.js';
import { initDebug } from '@/utils/debug.js';
import { experimentalBundlerOption } from '@/program/options/expirementalBundler/experimentalBundler.option.js';
import { preActionHook } from '@/program/hooks/preAction/preAction.hook.js';
import packageJson from 'sku/package.json' with { type: 'json' };

const { name, description, version } = packageJson;

export const program = new Command()
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
