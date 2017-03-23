const cwd = process.cwd();
const path = require('path');
const fs = require('fs');
const skuConfigPath = path.join(cwd, 'sku.config.js');

const isDevServer = /scripts\/start\.js$/.test(process.argv[1]);
const buildName = process.argv[2];

const makeArray = x => Array.isArray(x) ? x : [x];
const buildConfigs = fs.existsSync(skuConfigPath) ? makeArray(require(skuConfigPath)) : [{}];

if (isDevServer && buildConfigs.length > 1 && !buildName) {
  console.log('ERROR: Build name must be provded, e.g. sku start hello');
  process.exit(1);
}

const builds = buildConfigs
  .filter(buildConfig => {
    if (!isDevServer) {
      return true;
    }

    return buildConfig.name === buildName;
  })
  .map(buildConfig => {
    const name = buildConfig.name || '';
    const env = buildConfig.env || {};
    const entry = buildConfig.entry || {};
    const clientEntry = path.join(cwd, entry.client || 'src/client.js');
    const renderEntry = path.join(cwd, entry.render || 'src/render.js');

    const public = path.join(cwd, buildConfig.public || 'public');
    const dist = path.join(cwd, buildConfig.target || 'dist');

    const seekStyleGuide = path.join(cwd, 'node_modules/seek-style-guide');

    const paths = {
      seekStyleGuide,
      clientEntry,
      renderEntry,
      public,
      dist
    };

    return {
      name,
      env,
      paths
    };
  });

if (isDevServer && builds.length === 0) {
  console.log(`ERROR: Build with the name "${buildName}" wasn't found`);
  process.exit(1);
}

module.exports = builds;
