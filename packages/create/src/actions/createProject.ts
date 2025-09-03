import { resolve } from 'node:path';
import { existsSync, statSync, mkdirSync } from 'node:fs';
import { isEmptyDir, cwd } from '@sku-lib/utils';
import { generatePackageJson } from '../generators/packageJson.js';
import { generateTemplateFiles } from '../generators/templates.js';
import { installDependencies } from '../services/install.js';
import { formatProject } from '../services/format.js';
import type { Template } from '../types/index.js';

export interface CreateProjectOptions {
  projectName: string;
  template: Template;
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

  createProjectDirectory(targetPath);

  await generatePackageJson(targetPath, { projectName, template });

  await generateTemplateFiles(targetPath, { projectName, template });

  await installDependencies(targetPath);

  await formatProject(targetPath);

  console.log('✅ Project created successfully!');
  console.log(`
Next steps:
  cd ${projectName === '.' ? '.' : projectName}
  npm start
  `);
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

const createProjectDirectory = (targetPath: string): void => {
  if (!existsSync(targetPath)) {
    mkdirSync(targetPath, { recursive: true });
    console.log(`📁 Created directory: ${targetPath}`);
  }
};
