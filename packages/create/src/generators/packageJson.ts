import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { type Template, isViteBasedTemplate } from '../types/index.js';
import type { SupportedPackageManager } from '@sku-private/utils';

// Deliberately a separate constant from the root `package.json@packageManager` field
// so that we don't forget to add a changeset.
export const scaffoldedAppPnpmVersion = 'pnpm@12.20.0';

export interface PackageJsonOptions {
  projectName: string;
  template: Template;
  packageManager: SupportedPackageManager;
}

export const generatePackageJson = async (
  targetPath: string,
  { projectName, template, packageManager }: PackageJsonOptions,
) => {
  const isVite = isViteBasedTemplate(template);
  const testFlag = isVite ? ' --run' : '';

  const packageJson = {
    name: projectName,
    version: '1.0.0',
    private: true,
    ...(isVite ? { type: 'module' } : {}),
    scripts: {
      start: 'sku start',
      build: 'sku build',
      test: `sku test${testFlag}`,
      format: 'sku format',
      lint: 'sku lint',
    },
    ...(packageManager === 'pnpm'
      ? { packageManager: scaffoldedAppPnpmVersion }
      : {}),
  };

  const packageJsonPath = join(targetPath, 'package.json');
  const packageJsonContent = `${JSON.stringify(packageJson, null, 2)}\n`;

  await writeFile(packageJsonPath, packageJsonContent, 'utf8');
};
