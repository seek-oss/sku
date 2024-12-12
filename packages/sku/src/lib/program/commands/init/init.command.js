import { Command } from 'commander';
import { packageManagerOption } from '../../options/packageManager/packageManager.option.js';
import { setPackageManager } from '../../../../context/packageManager.js';

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
  .action(async (projectName, verbose) => {
    const { initAction } = await import('./init.action.js');
    initAction(projectName, { verbose });
  });
