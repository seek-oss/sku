import os from 'node:os';

import { requireFromCwd } from '@sku-private/utils';
import isCI from '../../utils/isCI.js';
import provider, { setRealProvider } from './provider.js';
import skuPackageJson from 'sku/package.json' with { type: 'json' };
import debug from 'debug';

import type { SkuContext } from '../../context/createSkuContext.js';

const log = debug('sku:telemetry');

const setGlobalTags = ({ languages, bundler }: SkuContext) => {
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
    bundler,
  });
};

export const initializeTelemetry = (skuContext: SkuContext) => {
  setRealProvider();
  setGlobalTags(skuContext);
};

export default provider;
