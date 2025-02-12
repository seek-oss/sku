import { Command } from 'commander';
import { packageManagerOption } from '../../options/packageManager/packageManager.option.js';
import { setPackageManager } from '../../../services/packageManager/context/packageManager.js';
import { initAction } from '@/program/commands/init/init.action.js';

export const initCommand = new Command('init');

initCommand
  .description('Initialize a new sku project')
  .argument('[projectName]', 'Project name')
  .option(
    '--verbose',
    "Sets the underlying packageManager's log level to `verbose`",
  )
  .addOption(packageManagerOption)
  .on('option:package-manager', (packageManager) => {
    setPackageManager(packageManager);
  })
  .action(initAction);
