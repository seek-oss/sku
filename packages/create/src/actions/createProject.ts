import { resolve } from 'node:path';
import { existsSync, statSync } from 'node:fs';
import { isEmptyDir, cwd } from '@sku-lib/utils';

export interface CreateProjectOptions {
  projectName: string;
  template: 'webpack' | 'vite';
}

export const createProject = async ({
  projectName,
  template,
}: CreateProjectOptions) => {
  console.log(`🚀 Creating new sku project: ${projectName}`);
  console.log(`📦 Using template: ${template}`);

  const targetPath = resolveProjectPath(projectName);

  console.log(`📁 Target directory: ${targetPath}`);

  validateTargetDirectory(targetPath);

  console.log('✅ Directory validation complete');
  console.log(
    '🚧 Project creation is still in development - stopping here for now',
  );
};

const resolveProjectPath = (projectName: string): string => {
  // If projectName is '.', use current directory
  if (projectName === '.') {
    return cwd();
  }

  // Otherwise create subdirectory
  return resolve(cwd(), projectName);
};

const validateTargetDirectory = (targetPath: string): void => {
  if (!existsSync(targetPath)) {
    console.log(`📁 Directory ${targetPath} will be created`);
    return;
  }

  const stats = statSync(targetPath);
  if (!stats.isDirectory()) {
    throw new Error(`${targetPath} exists but is not a directory`);
  }

  const isEmpty = isEmptyDir(targetPath);
  if (!isEmpty) {
    throw new Error(
      `Directory ${targetPath} is not empty. Please choose an empty directory.`,
    );
  }

  console.log(`📁 Directory ${targetPath} exists and is empty`);
};
