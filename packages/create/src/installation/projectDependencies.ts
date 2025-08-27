import chalk from 'chalk';
import { install, installConfig } from '../utils/packageManagerRunner.js';
import { isAtLeastPnpmV10, isPnpm } from '../utils/packageManager.js';

import type { TemplateConfig } from '../templates/templateConfigs.js';

interface InstallOptions {
  verbose?: boolean;
}

export async function installProjectDependencies(
  templateConfig: TemplateConfig,
  options: InstallOptions = {},
): Promise<void> {
  const deps = templateConfig.dependencies;
  const devDeps = [...templateConfig.devDependencies, 'sku@latest'];

  console.log(`Installing dependencies. This might take a while.`);

  // Install PNPM plugin for v10+
  if (isPnpm && isAtLeastPnpmV10()) {
    console.log(
      `Installing PNPM config dependency ${chalk.cyan('pnpm-plugin-sku')}`,
    );
    try {
      await installConfig('pnpm-plugin-sku');
    } catch (error) {
      console.warn(
        `Failed to install pnpm-plugin-sku: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  console.log(
    `Installing ${deps
      .concat(devDeps)
      .map((x) => chalk.cyan(x))
      .join(', ')}...`,
  );
  console.log();

  const logLevel = options.verbose ? 'verbose' : 'regular';

  await install({ deps, logLevel });
  await install({
    deps: devDeps,
    type: 'dev',
    logLevel,
    exact: false,
  });
}
