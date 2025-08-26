import chalk from 'chalk';
import { install } from '../utils/packageInstaller.js';

import type { TemplateConfig } from '../templates/templateConfigs.js';

interface InstallOptions {
  verbose?: boolean;
}

export async function installProjectDependencies(
  templateConfig: TemplateConfig,
  options: InstallOptions = {},
): Promise<void> {
  const deps = templateConfig.dependencies;
  const devDeps = [
    ...templateConfig.devDependencies,
    'sku@latest', // Always use latest sku version
  ];

  console.log(`Installing dependencies. This might take a while.`);

  // Install PNPM plugin for v10+
  // if (isAtLeastPnpmV10()) {
  //   console.log(
  //     `Installing PNPM config dependency ${chalk.cyan('pnpm-plugin-sku')}`
  //   );
  //   await execAsync('pnpm add --config pnpm-plugin-sku');
  // }

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
