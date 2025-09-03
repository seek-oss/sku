import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { Template } from '../types/index.js';

export interface PackageJsonOptions {
  projectName: string;
  template: Template;
}

export const generatePackageJson = async (
  targetPath: string,
  { projectName }: PackageJsonOptions,
) => {
  const packageJson = {
    name: projectName,
    version: '1.0.0',
    private: true,
    scripts: {
      start: 'sku start',
      build: 'sku build',
      test: 'sku test',
      format: 'sku format',
      lint: 'sku lint',
    },
    devDependencies: {
      sku: '^14.11.0',
    },
  };

  const packageJsonPath = join(targetPath, 'package.json');
  const packageJsonContent = `${JSON.stringify(packageJson, null, 2)}\n`;

  await writeFile(packageJsonPath, packageJsonContent, 'utf8');

  console.log('📄 Generated package.json');
};
