const cwd = process.cwd();
const path = require('path');
const fs = require('fs');
const inquirer = require('inquirer');
const deasyncPromise = require('deasync-promise');
const args = require('./args');
const { createHooks } = require('../lib/hooks');
const { applyPlugin } = require('../lib/plugins');

const skuConfigPath = path.join(cwd, args.config);

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
    const storybookPort = buildConfig.storybookPort || 8081;
    const initialPath = buildConfig.initialPath || '/';

    const polyfills = buildConfig.polyfills || [];

    const webpackDecorator =
      buildConfig.dangerouslySetWebpackConfig || defaultDecorator;
    const jestDecorator =
      buildConfig.dangerouslySetJestConfig || defaultDecorator;
    const eslintDecorator =
      buildConfig.dangerouslySetESLintConfig || defaultDecorator;

    const paths = {
      src: (buildConfig.srcPaths || ['src']).map(srcPath =>
        path.join(cwd, srcPath)
      ),
      compilePackages: [
        'sku',
        'seek-style-guide',
        'seek-asia-style-guide',
        'braid-design-system',
        ...compilePackages
      ],
      clientEntry: path.join(cwd, entry.client || 'src/client.js'),
      renderEntry: path.join(cwd, entry.render || 'src/render.js'),
      public: path.join(cwd, buildConfig.public || 'public'),
      publicPath: buildConfig.publicPath || '/',
      dist: path.join(cwd, buildConfig.target || 'dist')
    };

    const hooks = createHooks();

    if (buildConfig.plugins && buildConfig.plugins.length) {
      buildConfig.plugins.forEach(plugin => applyPlugin(plugin, hooks));
    }

    return {
      name,
      env,
      paths,
      locales,
      webpackDecorator,
      jestDecorator,
      eslintDecorator,
      hosts,
      port,
      storybookPort,
      polyfills,
      initialPath,
      hooks
    };
  });

if (args.script === 'start' && builds.length === 0) {
  console.log(`ERROR: Build with the name "${buildName}" wasn't found`);
  process.exit(1);
}

module.exports = builds;
