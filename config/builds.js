const cwd = process.cwd();
const path = require('path');
const fs = require('fs');
const skuConfigPath = path.join(cwd, 'sku.config.js');
const args = require('./args');

const makeArray = x => Array.isArray(x) ? x : [x];
const buildConfigs = fs.existsSync(skuConfigPath)
  ? makeArray(require(skuConfigPath))
  : [{}];

if (args.script === 'start' && buildConfigs.length > 1 && !args.buildName) {
  console.log('ERROR: Build name must be provded, e.g. sku start hello');
  process.exit(1);
}

const builds = buildConfigs
  .filter(buildConfig => {
    return args.script === 'start' ? buildConfig.name === args.buildName : true;
  })
  .map(buildConfig => {
    const name = buildConfig.name || '';
    const env = buildConfig.env || {};
    const entry = buildConfig.entry || {};

    const paths = {
      seekStyleGuide: path.join(cwd, 'node_modules/seek-style-guide'),
      clientEntry: path.join(cwd, entry.client || 'src/client.js'),
      renderEntry: path.join(cwd, entry.render || 'src/render.js'),
      public: path.join(cwd, buildConfig.public || 'public'),
      dist: path.join(cwd, buildConfig.target || 'dist')
    };

    return {
      name,
      env,
      paths
    };
  });

if (args.script === 'start' && builds.length === 0) {
  console.log(`ERROR: Build with the name "${args.buildName}" wasn't found`);
  process.exit(1);
}

module.exports = builds;
