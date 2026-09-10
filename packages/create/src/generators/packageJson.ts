import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { type Template, isViteBasedTemplate } from '../types/index.js';
import {
  skuPackageManager,
  type SupportedPackageManager,
} from '@sku-private/utils';

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
    // Pin to sku's pnpm. The running CLI or a registry tag can disagree
    // with this version and make install try to switch.
    ...(packageManager === 'pnpm' ? { packageManager: skuPackageManager } : {}),
  };

  const packageJsonPath = join(targetPath, 'package.json');
  const packageJsonContent = `${JSON.stringify(packageJson, null, 2)}\n`;

  await writeFile(packageJsonPath, packageJsonContent, 'utf8');
};
