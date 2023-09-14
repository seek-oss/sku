const os = require('node:os');

const { getPathFromCwd } = require('../lib/cwd');
const isCI = require('../lib/isCI');
const provider = require('./provider');
const skuVersion = require('../package.json').version;

const { languages } = require('../context');

let projectName = 'unknown';
try {
  const packageJson = require(getPathFromCwd('package.json'));

  if (packageJson.name) {
    projectName = packageJson.name;
  }
} catch (e) {}

provider.addGlobalTags({
  ci: isCI,
  version: skuVersion,
  project: projectName,
  os: os.platform(),
  languageSupport: Boolean(languages) ? 'multi' : 'single',
});

module.exports = provider;
