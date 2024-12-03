import os from 'node:os';

import { requireFromCwd } from '../lib/cwd';
import isCI from '../lib/isCI';
import provider from './provider';
import skuPackageJson from '../package.json' with { type: 'json' };

import { languages } from '../context';

let projectName = 'unknown';
let braidVersion = 'unknown';
const skuVersion = skuPackageJson.version;
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

export default provider;
