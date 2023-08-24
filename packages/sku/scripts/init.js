#!/usr/bin/env node

const { isYarn, runCommand } = require('../lib/packageManager');

const chalk = require('chalk');
const fs = require('fs/promises');
const { posix: path } = require('path');
const emptyDir = require('empty-dir');
const validatePackageName = require('validate-npm-package-name');
const dedent = require('dedent');
const { setCwd } = require('../lib/cwd');
const prettierWrite = require('../lib/runPrettier').write;
const esLintFix = require('../lib/runESLint').fix;
const configure = require('../lib/configure');
const install = require('../lib/install');
const banner = require('../lib/banner');
const toPosixPath = require('../lib/toPosixPath');
const trace = require('debug')('sku:init');
const glob = require('fast-glob');
const ejs = require('ejs');

const args = require('../config/args');

const removeLeadingUnderscoreFromFileName = (filePath) => {
  const basename = path.basename(filePath);

  if (basename.startsWith('_')) {
    const normalizedFileName = basename.replace(/^_/, '');
    const dirname = path.dirname(filePath);

    return path.join(dirname, normalizedFileName);
  }

  return filePath;
};

const getTemplateFileDestinationFromRoot =
  (projectRoot, templateDirectory) => (filePath) => {
    const normalizedFilePath = removeLeadingUnderscoreFromFileName(filePath);
    const filePathRelativeToTemplate =
      normalizedFilePath.split(templateDirectory)[1];

    return path.join(projectRoot, filePathRelativeToTemplate);
  };

(async () => {
  const projectName = args.argv[0];

  const usage = () => {
    console.log('Usage:');

    console.log(
      `  ${chalk.cyan('sku init')} ${chalk.green(
        '<project-directory>',
      )} [--verbose]`,
    );
    console.log();
    console.log('For example:');
    console.log(`  ${chalk.cyan('sku init')} ${chalk.green('my-seek-ui')}`);
    process.exit(1);
  };

  if (args.argv.indexOf('--help') >= 0) {
    usage();
    process.exit(0);
  }

  if (!projectName) {
    usage();
    process.exit(1);
  }

  const verbose = args.argv.indexOf('--verbose') >= 0;

  const root = path.resolve(projectName);
  setCwd(root);

  trace(`Creating project "${projectName}" in "${root}"`);

  const appName = path.basename(root);

  const reservedNames = [
    'react',
    'react-dom',
    'sku',
    'braid-design-system',
  ].sort();

  const {
    validForNewPackages,
    errors = [],
    warnings = [],
  } = validatePackageName(appName);

  if (!validForNewPackages) {
    console.error(dedent`
    Could not create a project called ${chalk.red(`"${appName}"`)} \
    because of npm naming restrictions:
  `);

    const results = [...errors, ...warnings];
    results.forEach((result) => console.error(chalk.red(`  *  ${result}`)));

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

  await fs.mkdir(projectName, { recursive: true });

  if (!emptyDir.sync(root)) {
    console.log(`The directory ${chalk.green(projectName)} is not empty.`);
    process.exit(1);
  }

  console.log(`Creating a new sku project in ${chalk.green(root)}.`);
  console.log();

  const packageJson = {
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
  const packageJsonString = JSON.stringify(packageJson, null, 2);

  await fs.writeFile(path.join(root, 'package.json'), packageJsonString);
  process.chdir(root);

  const useYarn = isYarn;

  const templateDirectory = path.join(toPosixPath(__dirname), '../template');
  const templateFiles = await glob(`${templateDirectory}/**/*`, {
    onlyFiles: true,
  });

  const getTemplateFileDestination = getTemplateFileDestinationFromRoot(
    root,
    templateDirectory,
  );

  await Promise.all(
    templateFiles.map(async (file) => {
      const fileContents = await ejs.renderFile(file, {
        appName,
        gettingStartedDocs: useYarn
          ? dedent`
            First of all, make sure you've installed [Yarn](https://yarnpkg.com).

            Then, install dependencies:

            \`\`\`bash
            $ yarn
            \`\`\`
            `
          : dedent`
            Install dependencies:

            \`\`\`bash
            $ npm install
            \`\`\`
            `,
        startScript: useYarn ? 'yarn start' : 'npm start',
        testScript: useYarn ? 'yarn test' : 'npm test',
        lintScript: useYarn ? 'yarn lint' : 'npm run lint',
        formatScript: useYarn ? 'yarn format' : 'npm run format',
        buildScript: useYarn ? 'yarn build' : 'npm run build',
      });
      const destination = getTemplateFileDestination(file);

      // Ensure folders exist before writing files to them
      await fs.mkdir(path.dirname(destination), { recursive: true });
      await fs.writeFile(destination, fileContents);
    }),
  );

  const deps = ['braid-design-system', 'react', 'react-dom'];

  const devDeps = [
    '@vanilla-extract/css',
    'sku',
    '@types/react',
    '@types/react-dom',
  ];

  console.log('Installing packages. This might take a couple of minutes.');
  console.log(
    `Installing ${deps
      .concat(devDeps)
      .map((x) => chalk.cyan(x))
      .join(', ')}...`,
  );
  console.log();

  await install({ deps, verbose, useYarn });
  await install({ deps: devDeps, type: 'dev', exact: false, verbose, useYarn });

  await configure();
  await esLintFix();
  await prettierWrite();

  const nextSteps = [
    `${chalk.cyan('cd')} ${projectName}`,
    `${chalk.cyan(`${runCommand} start`)}`,
  ]
    .filter(Boolean)
    .join('\n');

  banner('info', `${projectName} created`, [
    'Get started by running:',
    nextSteps,
  ]);
})();
