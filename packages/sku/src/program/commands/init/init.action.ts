import chalk from 'chalk';
import { mkdir, writeFile } from 'node:fs/promises';
import { posix as path } from 'node:path';
import dedent from 'dedent';

import { fdir as Fdir } from 'fdir';
import { Eta } from 'eta';
import debug from 'debug';
import semver from 'semver';

import type { SkuContext } from '@/context/createSkuContext.js';

import {
  packageManager,
  getRunCommand,
  getPackageManagerInstallPage,
  getInstallCommand,
  packageManagerVersion,
} from '@/services/packageManager/packageManager.js';
import { write as prettierWrite } from '@/services/prettier/runPrettier.js';
import { fix as esLintFix } from '@/services/eslint/runESLint.js';
import install from '@/services/packageManager/install.js';

import configure from '@/utils/configureApp.js';

import { setCwd } from '@/utils/cwd.js';
import banner from '@/utils/banners/banner.js';
import toPosixPath from '@/utils/toPosixPath.js';
import { isEmptyDir } from '@/utils/isEmptyDir.js';

const trace = debug('sku:init');

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
// See https://github.com/dword-design/package-name-regex/blob/acae7d482b1d03379003899df4d484238625364d/src/index.js#L1-L2
const packageNameRegex =
  /^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/;

export const initAction = async (
  projectName: string,
  { verbose, skuContext }: { verbose: boolean; skuContext: SkuContext },
) => {
  const root = path.resolve(projectName);
  setCwd(root);

  trace(`Creating project "${projectName}" in "${root}"`);
  console.log({
    packageManager,
  });

  const appName = path.basename(root);

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
  )} because of npm naming restrictions. \
  Please see https://docs.npmjs.com/cli/configuring-npm/package-json for package name rules.
`);

    process.exit(1);
  }

  if (reservedNames.indexOf(appName) >= 0) {
    console.error(
      chalk.red(dedent`
    We cannot create a project called \
    ${chalk.green(appName)} \
    because a dependency with the same name exists.
    Due to the way npm works, the following names are not allowed:

    ${chalk.cyan(reservedNames.map((depName) => `  ${depName}`).join('\n'))}

    Please choose a different project name.
  `),
    );
    process.exit(1);
  }

  await mkdir(projectName, { recursive: true });

  if (!isEmptyDir(root)) {
    console.log(`The directory ${chalk.green(projectName)} is not empty.`);
    process.exit(1);
  }

  console.log(`Creating a new sku project in ${chalk.green(root)}.`);
  console.log();

  const packageJson: Record<string, any> = {
    name: appName,
    version: '0.1.0',
    private: true,
    scripts: {
      start: 'sku start',
      test: 'sku test',
      build: 'sku build',
      serve: 'sku serve',
      lint: 'sku lint',
      format: 'sku format',
    },
  };

  const isAtLeastPnpmV10 =
    packageManager === 'pnpm' &&
    packageManagerVersion &&
    semver.satisfies(packageManagerVersion, '>=10.0.0');

  if (isAtLeastPnpmV10) {
    trace(
      'PNPM version is >= 10.0.0, adding "pnpm.onlyBuiltDependencies" to package.json',
    );
    // Allows `pnpm` to run `sku`'s, and its dependencies', build scripts
    // See https://pnpm.io/package_json#pnpmonlybuiltdependencies
    packageJson.pnpm = {
      // We transitively depend on `esbuild` via Vanilla Extract
      onlyBuiltDependencies: ['sku', '@swc/core', 'esbuild'],
    };
  }

  const packageJsonString = JSON.stringify(packageJson, null, 2);

  await writeFile(path.join(root, 'package.json'), packageJsonString);
  process.chdir(root);

  const templateDirectory = path.join(
    toPosixPath(__dirname),
    '../../../../template',
  );

  const templateFiles = await new Fdir()
    .withBasePath()
    .crawl(templateDirectory)
    .withPromise();

  const getTemplateFileDestination = getTemplateFileDestinationFromRoot(
    root,
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
    // Defaults to `it`
    varName: 'data',
    // Defaults to `.eta`, setting it to an empty string lets us use any file extension, which
    // mimics how `ejs` works by default
    defaultExtension: '',
    // Defaults to trimming trailing newlines, which we don't want
    autoTrim: false,
  });

  await Promise.all(
    templateFiles.map(async (file) => {
      const fileContents = await eta.renderAsync(
        path.relative(templateDirectory, file),
        templateData,
      );

      const destination = getTemplateFileDestination(file);

      // Ensure folders exist before writing files to them
      await mkdir(path.dirname(destination), { recursive: true });
      await writeFile(destination, fileContents);
    }),
  );

  // TODO: Remove versions from react deps once we support React 19
  const deps = ['braid-design-system', 'react@^18.3.1', 'react-dom@^18.3.1'];

  const devDeps = [
    '@vanilla-extract/css',
    'sku',
    '@types/react@^18.3.12',
    '@types/react-dom@^18.3.1',
  ];

  console.log(
    `Installing packages with ${chalk.bold(
      packageManager,
    )}. This might take a couple of minutes.`,
  );
  console.log(
    `Installing ${deps
      .concat(devDeps)
      .map((x) => chalk.cyan(x))
      .join(', ')}...`,
  );
  console.log();

  const logLevel = verbose ? 'verbose' : 'regular';

  await install({ deps, logLevel });
  await install({
    deps: devDeps,
    type: 'dev',
    logLevel,
    exact: false,
  });

  skuContext.configPath = 'sku.config.ts';

  await configure(skuContext);
  await esLintFix({ skuContext });
  await prettierWrite();

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
