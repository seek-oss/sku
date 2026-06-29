import os from 'node:os';

import { requireFromCwd } from '@sku-private/utils';
import isCI from '../../utils/isCI.js';
import provider, { registerGlobalTags } from './provider.js';
import skuPackageJson from 'sku/package.json' with { type: 'json' };
import debug from 'debug';

import type { SkuContext } from '../../context/createSkuContext.js';

const log = debug('sku:telemetry');

const computeGlobalTags = ({ languages, bundler }: SkuContext) => {
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

  return {
    ci: isCI,
    version: skuVersion,
    braidVersion,
    project: projectName,
    os: os.platform(),
    languageSupport: languages ? 'multi' : 'single',
    bundler,
  };
};

/**
 * Registers the global tags for the current sku command. The tags are only
 * computed if telemetry ends up being used, so this is safe to call eagerly
 * (e.g. from the preAction hook) without triggering the work for commands that
 * never emit metrics.
 */
export const setGlobalTags = (skuContext: SkuContext) => {
  registerGlobalTags(() => computeGlobalTags(skuContext));
};

export default provider;
