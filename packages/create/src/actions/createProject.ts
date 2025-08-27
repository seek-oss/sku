import chalk from 'chalk';
import { mkdir, writeFile } from 'node:fs/promises';
import { posix as path } from 'node:path';
import prompts from 'prompts';

import {
  validateProjectName,
  ProjectValidationError,
} from '../validation/projectValidation.js';
import { generatePackageJson } from '../config/packageJsonGenerator.js';
import { installProjectDependencies } from '../installation/projectDependencies.js';
import { processTemplateFiles } from '../templates/templateProcessor.js';
import { TEMPLATES, type TemplateKey } from '../templates/templateConfigs.js';

import debug from 'debug';

import {
  packageManager,
  getRunCommand,
  rootDir,
  packageManagerVersion,
} from '../utils/packageManager.js';
import { write as prettierWrite } from '../utils/prettier.js';
import { fix as esLintFix } from '../utils/eslint.js';

import { setCwd } from '../utils/cwd.js';
import { banner } from '../utils/banner.js';
import { isEmptyDir } from '../utils/isEmptyDir.js';

const trace = debug('sku:create');

interface CreateProjectOptions {
  template?: string;
  verbose?: boolean;
  packageManager?: string;
}

const selectTemplate = async (template?: string): Promise<TemplateKey> => {
  if (template && template !== 'interactive' && template in TEMPLATES) {
    return template as TemplateKey;
  }

  const { selectedTemplate } = await prompts({
    type: 'select',
    name: 'selectedTemplate',
    message: 'Which template would you like to use?',
    choices: Object.entries(TEMPLATES).map(([key, config]) => ({
      title: config.name,
      description: config.description,
      value: key,
    })),
    initial: 0,
  });

  if (!selectedTemplate) {
    console.log('Template selection cancelled.');
    process.exit(1);
  }

  return selectedTemplate;
};

export const createProject = async (
  projectName: string,
  options: CreateProjectOptions = {},
) => {
  try {
    validateProjectName(projectName);
  } catch (error) {
    if (error instanceof ProjectValidationError) {
      console.error(error.message);
      process.exit(error.exitCode);
    }
    throw error;
  }

  const selectedTemplate = await selectTemplate(options.template);
  const templateConfig = TEMPLATES[selectedTemplate];

  const initDir = path.resolve(projectName);
  setCwd(initDir);

  trace(`Creating project "${projectName}" in "${initDir}"`);

  const appName = path.basename(initDir);

  if (!isEmptyDir(initDir)) {
    console.log(`The directory ${chalk.green(projectName)} is not empty.`);
    process.exit(1);
  }

  await mkdir(projectName, { recursive: true });

  console.log(`Creating a new sku project in ${chalk.green(initDir)}.`);
  console.log(`Using template: ${chalk.cyan(templateConfig.name)}`);
  console.log();

  const packageManagerInfo = {
    name: packageManager,
    version: packageManagerVersion,
    rootDir,
  };

  const packageJson = generatePackageJson(
    appName,
    templateConfig,
    packageManagerInfo,
    initDir,
  );

  const packageJsonString = JSON.stringify(packageJson, null, 2);
  await writeFile(path.join(initDir, 'package.json'), packageJsonString);
  process.chdir(initDir);

  await processTemplateFiles(selectedTemplate, initDir, appName);

  await installProjectDependencies(templateConfig, {
    verbose: options.verbose,
  });

  await esLintFix(initDir);
  await prettierWrite(initDir);

  const nextSteps = [
    `${chalk.cyan('cd')} ${projectName}`,
    `${chalk.cyan(getRunCommand('start'))}`,
  ]
    .filter(Boolean)
    .join('\n');

  banner('info', `${projectName} created`, [
    'Get started by running:',
    nextSteps,
  ]);
};
