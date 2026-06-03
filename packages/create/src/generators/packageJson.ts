import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { Template } from '../types/index.js';
import type { SupportedPackageManager } from '@sku-private/utils';
import { execAsync } from '../utils/execAsync.js';

export interface PackageJsonOptions {
  projectName: string;
  template: Template;
  packageManager: SupportedPackageManager;
}

export const generatePackageJson = async (
  targetPath: string,
  { projectName, template, packageManager }: PackageJsonOptions,
) => {
  const isVite = template === 'vite';
  const testFlag = isVite ? ' --run' : '';
  const resolvedPackageManager =
    await resolvePackageManagerField(packageManager);

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
    ...(resolvedPackageManager
      ? { packageManager: resolvedPackageManager }
      : {}),
  };

  const packageJsonPath = join(targetPath, 'package.json');
  const packageJsonContent = `${JSON.stringify(packageJson, null, 2)}\n`;

  await writeFile(packageJsonPath, packageJsonContent, 'utf8');
};

const resolvePackageManagerField = async (
  packageManager: SupportedPackageManager,
): Promise<string | null> => {
  if (packageManager !== 'pnpm') {
    return null;
  }

  const latestPnpmV11Version = (
    await execAsync(`pnpm view pnpm dist-tags.latest-11`)
  ).trim();

  if (!latestPnpmV11Version) {
    return null;
  }

  return `pnpm@${latestPnpmV11Version}`;
};
