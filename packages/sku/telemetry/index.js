const os = require('node:os');

const { getPathFromCwd, cwd } = require('../lib/cwd');
const isCI = require('../lib/isCI');
const provider = require('./provider');
const skuVersion = require('../package.json').version;

const { languages } = require('../context');

let projectName = 'unknown';
let braidVersion = 'unknown';
try {
  const packageJson = require(getPathFromCwd('package.json'));

  if (packageJson.name) {
    projectName = packageJson.name;
  }

  const braidPackageJson = require(require.resolve(
    'braid-design-system/package.json',
  ), [cwd()]);

  braidVersion = braidPackageJson.version;
} catch (e) {}

provider.addGlobalTags({
  ci: isCI,
  version: skuVersion,
  braidVersion,
  project: projectName,
  os: os.platform(),
  languageSupport: Boolean(languages) ? 'multi' : 'single',
});

module.exports = provider;
