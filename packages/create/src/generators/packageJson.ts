import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { Template } from '../types/index.js';

export interface PackageJsonOptions {
  projectName: string;
  template: Template;
}

const DEPENDENCIES = {
  'braid-design-system': 'latest',
  react: 'latest',
  'react-dom': 'latest',
};

const DEV_DEPENDENCIES = {
  '@vanilla-extract/css': '^1.15.5',
  sku: '^14.11.0',
  '@types/react': '^18.3.5',
  '@types/react-dom': '^18.3.0',
};

export const generatePackageJson = async (
  targetPath: string,
  { projectName, template }: PackageJsonOptions,
) => {
  const isVite = template === 'vite';
  const bundlerFlag = isVite ? ' --experimental-bundler' : '';

  const packageJson = {
    name: projectName,
    version: '1.0.0',
    private: true,
    ...(isVite ? { type: 'module' } : {}),
    scripts: {
      start: `sku start${bundlerFlag}`,
      build: `sku build${bundlerFlag}`,
      test: 'sku test',
      format: 'sku format',
      lint: 'sku lint',
    },
    dependencies: DEPENDENCIES,
    devDependencies: DEV_DEPENDENCIES,
  };

  const packageJsonPath = join(targetPath, 'package.json');
  const packageJsonContent = `${JSON.stringify(packageJson, null, 2)}\n`;

  await writeFile(packageJsonPath, packageJsonContent, 'utf8');
};
