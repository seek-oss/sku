#!/usr/bin/env node

const chalk = require('chalk');
const fs = require('fs-extra');
const bent = require('bent');
const path = require('path');
const emptyDir = require('empty-dir');
const validatePackageName = require('validate-npm-package-name');
const kopy = require('kopy');
const dedent = require('dedent');
const { setCwd } = require('../lib/cwd');
const detectYarn = require('../lib/detectYarn');
const prettierWrite = require('../lib/runPrettier').write;
const configure = require('../lib/configure');
const install = require('../lib/install');
const { getMissingHosts } = require('../lib/hosts');
const { getSuggestedScript } = require('../lib/suggestScript');

const getFileContent = bent('string');

const args = require('../config/args');

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
    results.forEach(result => console.error(chalk.red(`  *  ${result}`)));

    process.exit(1);
  }

  if (reservedNames.indexOf(appName) >= 0) {
    console.error(
      chalk.red(dedent`
      We cannot create a project called \
      ${chalk.green(appName)} \
      because a dependency with the same name exists.
      Due to the way npm works, the following names are not allowed:

      ${chalk.cyan(reservedNames.map(depName => `  ${depName}`).join('\n'))}

      Please choose a different project name.
    `),
    );
    process.exit(1);
  }

  fs.ensureDirSync(projectName);

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
      lint: 'sku lint',
      format: 'sku format',
    },
    husky: {
      hooks: {
        'pre-commit': 'sku pre-commit',
      },
    },
  };
  const packageJsonString = JSON.stringify(packageJson, null, 2);

  fs.writeFileSync(path.join(root, 'package.json'), packageJsonString);
  process.chdir(root);

  const braidThemeFile = await getFileContent(
    'https://raw.githubusercontent.com/seek-oss/braid-design-system/master/lib/themes/index.ts',
  );

  const braidThemes = braidThemeFile
    .match(/default as (.*) }/g)
    .map(themeMatch => themeMatch.match(/default as (.*) }/))
    .map(([_, themeName]) => themeName)
    .sort();

  const useYarn = detectYarn();

  await kopy(path.join(__dirname, '../template'), root, {
    prompts: [
      {
        name: 'sites',
        type: 'checkbox',
        message: 'Which Braid themes would you like?',
        validate: sites =>
          sites.length > 0 ? true : 'Please select at least one Braid theme',
        choices: braidThemes,
      },
    ],
    move: {
      // Remove leading underscores from filenames:
      '_*': filepath => filepath.replace(/^_/, ''),
    },
    data: answers => ({
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
      sites: answers.sites
        .map(site => {
          if (site === 'seekAnz') {
            return `{ name: 'seekAnz', host: 'dev.seek.com.au' }`;
          }

          return `{ name: '${site}', host: 'dev.${site.toLowerCase()}.com' }`;
        })
        .join(','),
    }),
  });

  const deps = ['braid-design-system', 'sku', 'react', 'react-dom'];

  const devDeps = ['husky', '@types/react', '@types/react-dom'];

  console.log('Installing packages. This might take a couple of minutes.');
  console.log(
    `Installing ${deps
      .concat(devDeps)
      .map(x => chalk.cyan(x))
      .join(', ')}...`,
  );
  console.log();

  await install({ deps, verbose, useYarn });
  await install({ deps: devDeps, type: 'dev', exact: false, verbose, useYarn });

  await configure();
  await prettierWrite();

  // read configured sites from templated sku config
  const sites = require(path.join(root, 'sku.config.js')).sites;
  const missingHosts = await getMissingHosts(sites);
  const setupHostScript = await getSuggestedScript('setup-hosts', {
    sudo: true,
  });

  const nextSteps = [
    `${chalk.cyan('cd')} ${projectName}`,
    missingHosts.length > 0 ? chalk.cyan(setupHostScript) : null,
    `${chalk.cyan('yarn start')}`,
  ]
    .filter(Boolean)
    .join('\n');

  console.log(dedent`
    ---------------------------------------------------------------

    ${chalk.blue(projectName)} created

    Get started by running:

    ${nextSteps}

    ---------------------------------------------------------------
  `);
})();
