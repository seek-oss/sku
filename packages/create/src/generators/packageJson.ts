import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { type Template, isViteBasedTemplate } from '../types/index.js';
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
  const isVite = isViteBasedTemplate(template);
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

  const latestPnpmV11Version =
    // The `latest-*` tag controls what major version of PNPM is configured in new apps.
    // When updating it in the future, ensure that the sku repo itself also updates to the
    // same major version. Not doing this can result in inconsistent test behaviour.
    // See https://github.com/seek-oss/sku/pull/1586.
    (await execAsync(`pnpm view pnpm dist-tags.latest-11`)).trim();

  if (!latestPnpmV11Version) {
    return null;
  }

  return `pnpm@${latestPnpmV11Version}`;
};
