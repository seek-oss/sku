const os = require('node:os');

const { requireFromCwd } = require('../lib/cwd');
const isCI = require('../lib/isCI');
const provider = require('./provider');
const skuVersion = require('../package.json').version;

const { languages } = require('../context');

let projectName = 'unknown';
let braidVersion = 'unknown';
try {
  const packageJson = requireFromCwd('./package.json');

  if (packageJson.name) {
    projectName = packageJson.name;
  }

  const braidPackageJson = requireFromCwd('braid-design-system/package.json');
  braidVersion = braidPackageJson.version;
} catch (e) {
  require('debug')('sku:telemetry')(
    `Error getting project name or braid version: ${e}`,
  );
}

provider.addGlobalTags({
  ci: isCI,
  version: skuVersion,
  braidVersion,
  project: projectName,
  os: os.platform(),
  languageSupport: Boolean(languages) ? 'multi' : 'single',
});

module.exports = provider;
