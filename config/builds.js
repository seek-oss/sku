const cwd = process.cwd();
const path = require('path');
const fs = require('fs');
const inquirer = require('inquirer');
const deasyncPromise = require('deasync-promise');
const skuConfigPath = path.join(cwd, 'sku.config.js');
const args = require('./args');

const makeArray = x => (Array.isArray(x) ? x : [x]);
const buildConfigs = fs.existsSync(skuConfigPath)
  ? makeArray(require(skuConfigPath))
  : [{}];

const defaultDecorator = a => a;

let buildName = args.buildName;

if (!buildName && args.script === 'start' && buildConfigs.length > 1) {
  const answers = deasyncPromise(
    inquirer.prompt([
      {
        type: 'list',
        name: 'buildName',
        message:
          'You appear to be running a monorepo. Which project would you like to work on?',
        choices: buildConfigs.map(x => x.name).filter(Boolean)
      }
    ])
  );

  buildName = answers.buildName;
}

const builds = buildConfigs
  .filter(buildConfig => {
    return args.script === 'start' ? buildConfig.name === buildName : true;
  })
  .map(buildConfig => {
    const name = buildConfig.name || '';
    const env = Object.assign(
      {
        SKU_TENANT: args.tenant || ''
      },
      buildConfig.env || {}
    );
    const entry = buildConfig.entry || {};
    const locales = buildConfig.locales || [''];
    const compilePackages = buildConfig.compilePackages || [];
    const hosts = buildConfig.hosts || ['localhost'];
    const port = buildConfig.port || 8080;
    const webpackDecorator =
      buildConfig.dangerouslySetWebpackConfig || defaultDecorator;
    const jestDecorator =
      buildConfig.dangerouslySetJestConfig || defaultDecorator;

    let renderEntry = path.join(cwd, 'src/render.js');
    let serverEntry = null;
    if (entry.render) {
      renderEntry = path.join(cwd, entry.render);
    } else if (entry.server) {
      renderEntry = null;
      serverEntry = path.join(cwd, entry.server);
    }

    const paths = {
      src: path.join(cwd, 'src'),
      compilePackages: [
        path.join(cwd, 'node_modules/seek-style-guide'),
        ...compilePackages.map(package =>
          path.join(cwd, 'node_modules', package)
        )
      ],
      clientEntry: path.join(cwd, entry.client || 'src/client.js'),
      renderEntry: renderEntry,
      serverEntry: serverEntry,
      public: path.join(cwd, buildConfig.public || 'public'),
      dist: path.join(cwd, buildConfig.target || 'dist')
    };

    return {
      name,
      env,
      paths,
      locales,
      webpackDecorator,
      jestDecorator,
      hosts,
      port
    };
  });

if (args.script === 'start' && builds.length === 0) {
  console.log(`ERROR: Build with the name "${buildName}" wasn't found`);
  process.exit(1);
}

module.exports = builds;
