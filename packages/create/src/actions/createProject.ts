import { resolve, basename } from 'node:path';
import { styleText } from 'node:util';
import { existsSync, mkdirSync } from 'node:fs';
import { isEmptyDir, cwd, getRunCommand, banner } from '@sku-private/utils';
import { generatePackageJson } from '../generators/packageJson.js';
import { generateTemplateFiles } from '../generators/templates.js';
import { installDependencies } from '../services/install.js';
import { formatProject } from '../services/format.js';
import { validatePackageName } from '../validation/packageName.js';
import type { Template } from '../types/index.js';

interface CreateProjectOptions {
  targetDir: string;
  template: Template;
}

export const createProject = async ({
  targetDir,
  template,
}: CreateProjectOptions) => {
  const targetPath = resolveProjectPath(targetDir);
  const projectName = targetDir === '.' ? basename(targetPath) : targetDir;

  console.log(
    `🚀 Creating new sku project: ${styleText('cyan', projectName)} with ${styleText('cyan', template)} template`,
  );

  validatePackageName(projectName);

  console.log(`📁 Creating project at ${styleText('cyan', targetPath)}`);

  validateTargetDirectory(targetPath);
  createProjectDirectory(targetPath);

  await generatePackageJson(targetPath, { projectName, template });
  await generateTemplateFiles(targetPath, { projectName, template });
  await installDependencies(targetPath, { template });
  await formatProject(targetPath);

  const nextSteps = [
    targetDir !== '.' ? `${styleText('cyan', `cd ${targetDir}`)}` : null,
    `${styleText('cyan', getRunCommand('start'))}`,
  ]
    .filter(Boolean)
    .join('\n');

  banner('info', `${projectName} created`, [
    'Get started by running:',
    nextSteps,
  ]);
};

const resolveProjectPath = (targetDir: string) => {
  if (targetDir === '.') {
    return cwd();
  }

  return resolve(cwd(), targetDir);
};

const validateTargetDirectory = (targetPath: string) => {
  if (!existsSync(targetPath)) {
    return;
  }

  const isEmpty = isEmptyDir(targetPath);
  if (!isEmpty) {
    throw new Error(
      `Directory ${targetPath} is not empty. Please choose an empty directory.`,
    );
  }

  console.log(`📁 Directory ${targetPath} exists and is empty`);
};

const createProjectDirectory = (targetPath: string) => {
  if (!existsSync(targetPath)) {
    mkdirSync(targetPath, { recursive: true });
  }
};
