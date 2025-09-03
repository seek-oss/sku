import { resolve } from 'node:path';
import { styleText } from 'node:util';
import { existsSync, statSync, mkdirSync } from 'node:fs';
import { isEmptyDir, cwd, getRunCommand, banner } from '@sku-lib/utils';
import { generatePackageJson } from '../generators/packageJson.js';
import { generateTemplateFiles } from '../generators/templates.js';
import { installDependencies } from '../services/install.js';
import { formatProject } from '../services/format.js';
import { validatePackageName } from '../validation/packageName.js';
import type { Template } from '../types/index.js';

export interface CreateProjectOptions {
  projectName: string;
  template: Template;
}

export const createProject = async ({
  projectName,
  template,
}: CreateProjectOptions) => {
  console.log(
    `🚀 Creating new sku project: ${styleText('cyan', projectName)} with ${styleText('cyan', template)} template`,
  );

  const targetPath = resolveProjectPath(projectName);
  validatePackageName(targetPath);

  console.log(`📁 Creating project at ${styleText('cyan', targetPath)}`);

  validateTargetDirectory(targetPath);

  createProjectDirectory(targetPath);

  await generatePackageJson(targetPath, { projectName, template });

  await generateTemplateFiles(targetPath, { projectName, template });

  await installDependencies(targetPath);

  await formatProject(targetPath);

  const nextSteps = [
    `${styleText('cyan', 'cd')} ${projectName}`,
    `${styleText('cyan', getRunCommand('start'))}`,
  ]
    .filter(Boolean)
    .join('\n');

  banner('info', `${projectName} created`, [
    'Get started by running:',
    nextSteps,
  ]);
};

const resolveProjectPath = (projectName: string): string => {
  if (projectName === '.') {
    return cwd();
  }

  return resolve(cwd(), projectName);
};

const validateTargetDirectory = (targetPath: string): void => {
  if (!existsSync(targetPath)) {
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
  }
};
