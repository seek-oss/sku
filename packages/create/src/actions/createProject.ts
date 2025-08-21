import chalk from 'chalk';
import { mkdir, writeFile } from 'node:fs/promises';
import { posix as path } from 'node:path';
import dedent from 'dedent';
import prompts from 'prompts';

import { fdir as Fdir } from 'fdir';
import { Eta } from 'eta';
import debug from 'debug';

import {
  packageManager,
  getRunCommand,
  getPackageManagerInstallPage,
  getInstallCommand,
  isAtLeastPnpmV10,
  rootDir,
  packageManagerVersion,
} from '../utils/packageManager.js';
import { write as prettierWrite } from '../utils/prettier.js';
import { fix as esLintFix } from '../utils/eslint.js';
import { install } from '../utils/packageInstaller.js';

import { setCwd } from '../utils/cwd.js';
import { banner } from '../utils/banner.js';
import { toPosixPath } from '../utils/toPosixPath.js';
import { isEmptyDir } from '../utils/isEmptyDir.js';
import { execAsync } from '../utils/execAsync.js';

const trace = debug('sku:create');

const __dirname = path.dirname(new URL(import.meta.url).pathname);

const removeLeadingUnderscoreFromFileName = (filePath: string) => {
  const basename = path.basename(filePath);

  if (basename.startsWith('_')) {
    const normalizedFileName = basename.replace(/^_/, '');
    const dirname = path.dirname(filePath);

    return path.join(dirname, normalizedFileName);
  }

  return filePath;
};

const getTemplateFileDestinationFromRoot =
  (projectRoot: string, templateDirectory: string) => (filePath: string) => {
    const normalizedFilePath = removeLeadingUnderscoreFromFileName(filePath);
    const filePathRelativeToTemplate =
      normalizedFilePath.split(templateDirectory)[1];

    return path.join(projectRoot, filePathRelativeToTemplate);
  };

// Copied from `package-name-regex@4.0.0`
const packageNameRegex =
  /^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/;

interface CreateProjectOptions {
  template?: string;
  verbose?: boolean;
  packageManager?: string;
}

const TEMPLATES = {
  webpack: {
    name: 'Webpack (Default)',
    description: 'Standard React setup with Webpack bundler',
    dependencies: [
      'braid-design-system@latest',
      'react@latest',
      'react-dom@latest',
    ],
    devDependencies: [
      '@vanilla-extract/css',
      '@types/react',
      '@types/react-dom',
    ],
    scripts: {
      start: 'sku start',
      test: 'sku test',
      build: 'sku build',
      serve: 'sku serve',
      lint: 'sku lint',
      format: 'sku format',
    },
  },
  vite: {
    name: 'Vite (Experimental)',
    description: 'Modern React setup with Vite bundler (experimental)',
    dependencies: [
      'braid-design-system@latest',
      'react@latest',
      'react-dom@latest',
    ],
    devDependencies: [
      '@vanilla-extract/css',
      '@types/react',
      '@types/react-dom',
    ],
    scripts: {
      start: 'sku start --experimental-bundler',
      test: 'sku test',
      build: 'sku build --experimental-bundler',
      serve: 'sku serve',
      lint: 'sku lint',
      format: 'sku format',
    },
    packageJsonExtras: {
      type: 'module',
    },
  },
};

async function selectTemplate(
  template?: string,
): Promise<keyof typeof TEMPLATES> {
  if (template && template !== 'interactive' && template in TEMPLATES) {
    return template as keyof typeof TEMPLATES;
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
}

export const createProject = async (
  projectName: string,
  options: CreateProjectOptions = {},
) => {
  if (!projectName) {
    console.error(chalk.red('Project name is required'));
    process.exit(1);
  }

  const selectedTemplate = await selectTemplate(options.template);
  const templateConfig = TEMPLATES[selectedTemplate];

  const initDir = path.resolve(projectName);
  setCwd(initDir);

  trace(`Creating project "${projectName}" in "${initDir}"`);

  const appName = path.basename(initDir);

  const reservedNames = [
    'react',
    'react-dom',
    'sku',
    'braid-design-system',
  ].sort();

  const isValidPackageName = packageNameRegex.test(appName);

  if (!isValidPackageName) {
    console.error(dedent`
      Could not create a project called ${chalk.red(
        `"${appName}"`,
      )} because of npm naming restrictions. 
      Please see https://docs.npmjs.com/cli/configuring-npm/package-json for package name rules.
    `);
    process.exit(1);
  }

  if (reservedNames.indexOf(appName) >= 0) {
    console.error(
      chalk.red(dedent`
        We cannot create a project called 
        ${chalk.green(appName)} 
        because a dependency with the same name exists.
        Due to the way npm works, the following names are not allowed:

        ${chalk.cyan(reservedNames.map((depName) => `  ${depName}`).join('\n'))}

        Please choose a different project name.
      `),
    );
    process.exit(1);
  }

  await mkdir(projectName, { recursive: true });

  if (!isEmptyDir(initDir)) {
    console.log(`The directory ${chalk.green(projectName)} is not empty.`);
    process.exit(1);
  }

  console.log(`Creating a new sku project in ${chalk.green(initDir)}.`);
  console.log(`Using template: ${chalk.cyan(templateConfig.name)}`);
  console.log();

  const packageJson: Record<string, any> = {
    name: appName,
    version: '0.1.0',
    private: true,
    scripts: templateConfig.scripts,
    ...('packageJsonExtras' in templateConfig
      ? templateConfig.packageJsonExtras
      : {}),
  };

  const isRepoRoot = rootDir === null || rootDir === initDir;
  const shouldConfigurePackageManagerField =
    isRepoRoot && packageManagerVersion;

  if (shouldConfigurePackageManagerField) {
    packageJson.packageManager = `${packageManager}@${packageManagerVersion}`;
  }

  const packageJsonString = JSON.stringify(packageJson, null, 2);

  await writeFile(path.join(initDir, 'package.json'), packageJsonString);
  process.chdir(initDir);

  const templateDirectory = path.join(
    toPosixPath(__dirname),
    `../../templates/${selectedTemplate}`,
  );

  const templateFiles = await new Fdir()
    .withBasePath()
    .crawl(templateDirectory)
    .withPromise();

  const getTemplateFileDestination = getTemplateFileDestinationFromRoot(
    initDir,
    templateDirectory,
  );

  const templateData = {
    appName,
    gettingStartedDocs: dedent`
      First of all, make sure you've installed [${packageManager}](${getPackageManagerInstallPage()}).

      Then, install dependencies:

      \`\`\`sh
      $ ${getInstallCommand()}
      \`\`\`
    `,
    startScript: getRunCommand('start'),
    testScript: getRunCommand('test'),
    lintScript: getRunCommand('lint'),
    formatScript: getRunCommand('format'),
    buildScript: getRunCommand('build'),
  };

  const eta = new Eta({
    views: templateDirectory,
    varName: 'data',
    defaultExtension: '',
    autoTrim: false,
  });

  await Promise.all(
    templateFiles.map(async (file) => {
      const fileContents = await eta.renderAsync(
        path.relative(templateDirectory, file),
        templateData,
      );

      const destination = getTemplateFileDestination(file);

      await mkdir(path.dirname(destination), { recursive: true });
      await writeFile(destination, fileContents);
    }),
  );

  const deps = templateConfig.dependencies;
  const devDeps = [
    ...templateConfig.devDependencies,
    'sku@latest', // Always use latest sku version
  ];

  console.log(
    `Installing dependencies with ${chalk.bold(
      packageManager,
    )}. This might take a while.`,
  );

  if (isAtLeastPnpmV10()) {
    console.log(
      `Installing PNPM config dependency ${chalk.cyan('pnpm-plugin-sku')}`,
    );
    await execAsync('pnpm add --config pnpm-plugin-sku');
  }

  console.log(
    `Installing ${deps
      .concat(devDeps)
      .map((x) => chalk.cyan(x))
      .join(', ')}...`,
  );
  console.log();

  const logLevel = options.verbose ? 'verbose' : 'regular';

  await install({ deps, logLevel });
  await install({
    deps: devDeps,
    type: 'dev',
    logLevel,
    exact: false,
  });

  // Run prettier and eslint to clean up generated files
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
