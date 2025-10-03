import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { Template } from '../types/index.js';

export interface PackageJsonOptions {
  projectName: string;
  template: Template;
}

export const generatePackageJson = async (
  targetPath: string,
  { projectName, template }: PackageJsonOptions,
) => {
  const isVite = template === 'vite';
  const testFlag = isVite ? ' --run' : '';

  const packageJson = {
    name: projectName,
    version: '1.0.0',
    private: true,
    ...(isVite ? { type: 'module' } : {}),
    scripts: {
      start: `sku start`,
      build: `sku build`,
      test: `sku test${testFlag}`,
      format: 'sku format',
      lint: 'sku lint',
    },
  };

  const packageJsonPath = join(targetPath, 'package.json');
  const packageJsonContent = `${JSON.stringify(packageJson, null, 2)}\n`;

  await writeFile(packageJsonPath, packageJsonContent, 'utf8');
};
