import os from 'node:os';

import { requireFromCwd } from '../lib/cwd.js';
import isCI from '../lib/isCI.js';
import provider from './provider.js';
import skuPackageJson from '../package.json' with { type: 'json' };
import debug from 'debug';

import { languages } from '../context/index.js';

const log = debug('sku:telemetry');

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
  log(`Error getting project name or braid version: ${e}`);
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
